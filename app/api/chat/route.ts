import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session/manager';
import { chatWithContext } from '@/lib/llm/chains/chat-chain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat - Chat with session context (streaming)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Report generation not completed yet' },
        { status: 400 }
      );
    }

    // Add user message to chat history
    sessionManager.updateSession(sessionId, {
      chatMessage: {
        role: 'user',
        content: message,
        timestamp: Date.now(),
      },
    });

    // Get updated session
    const updatedSession = sessionManager.getSession(sessionId);
    if (!updatedSession) {
      return NextResponse.json({ error: 'Session lost' }, { status: 500 });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get AI response with streaming
          const reply = await chatWithContext({
            session: updatedSession,
            userQuestion: message,
            enableWebSearch: true,
          });

          // Stream the response word by word for smooth effect
          const words = reply.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(word));
            
            // Small delay between words for smooth streaming effect
            await new Promise((resolve) => setTimeout(resolve, 30));
          }

          // Add assistant message to chat history
          sessionManager.updateSession(sessionId, {
            chatMessage: {
              role: 'assistant',
              content: reply,
              timestamp: Date.now(),
            },
          });

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Session-Id': sessionId,
      },
    });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat' },
      { status: 500 }
    );
  }
}
