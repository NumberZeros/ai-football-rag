import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/session - Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fixtureId } = body;

    if (!fixtureId || typeof fixtureId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid fixtureId' },
        { status: 400 }
      );
    }

    const sessionId = sessionManager.createSession({ fixtureId });

    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (error) {
    console.error('POST /api/session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session - Get session stats (for debugging)
 */
export async function GET() {
  try {
    const stats = sessionManager.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session stats' },
      { status: 500 }
    );
  }
}
