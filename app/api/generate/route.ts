import { NextRequest } from 'next/server';
import { sessionManager } from '@/lib/session/manager';
import { generateReport } from '@/lib/orchestrator/generator';
import { ProgressUpdate } from '@/lib/orchestrator/progress-tracker';
import { rateLimiter, formatResetTime } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function sseImmediateError(message: string, extra?: Record<string, any>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const payload = {
        message,
        ...extra,
      };
      controller.enqueue(
        encoder.encode(`event: server_error\ndata: ${JSON.stringify(payload)}\n\n`)
      );
      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify({ message: 'Stream closed' })}\n\n`)
      );
      controller.close();
    },
  });

  return sseResponse(stream);
}

/**
 * GET /api/generate?sessionId=xxx - Server-Sent Events stream for report generation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const customApiKey = searchParams.get('customApiKey');

  if (!sessionId) {
    return sseImmediateError('Missing sessionId parameter');
  }

  // Check rate limit (bypass if custom API key provided)
  if (!customApiKey) {
    const limitCheck = rateLimiter.checkLimit(request);
    if (!limitCheck.allowed) {
      const resetTime = limitCheck.limitType === 'minute'
        ? formatResetTime(limitCheck.resetAt.minute)
        : limitCheck.limitType === 'hour'
        ? formatResetTime(limitCheck.resetAt.hour)
        : formatResetTime(limitCheck.resetAt.day);
      
      return sseImmediateError(
        `Rate limit exceeded. You can try again in ${resetTime}, or provide your own OpenAI API key to bypass limits.`,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          limitType: limitCheck.limitType,
          resetAt: limitCheck.resetAt,
          remaining: limitCheck.remaining,
        }
      );
    }
    // Record request
    rateLimiter.recordRequest(request);
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) {
    return sseImmediateError('Session not found. The dev server likely restarted; please go back and generate again.', {
      code: 'SESSION_NOT_FOUND',
    });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE message
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Progress callback
        const progressCallback = (update: ProgressUpdate) => {
          sendEvent('progress', {
            stage: update.stage,
            progress: update.progress,
            message: update.message,
            currentTask: update.currentTask,
            details: update.details,
          });
        };

        // Start generation
        sendEvent('start', { sessionId, message: 'Starting report generation...' });

        await generateReport(sessionId, progressCallback);

        // Get final report
        const updatedSession = sessionManager.getSession(sessionId);
        if (updatedSession?.finalReport) {
          sendEvent('complete', {
            report: updatedSession.finalReport,
            message: 'Report generation completed!',
          });
        } else {
          throw new Error('Report generation completed but no report found');
        }

        sendEvent('done', { message: 'Stream closed' });
      } catch (error) {
        console.error('Report generation error:', error);
        sendEvent('server_error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}
