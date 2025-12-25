import { Session, CreateSessionParams, UpdateSessionParams } from './types';
import { randomUUID } from 'crypto';

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TTL = parseInt(process.env.SESSION_TTL_MS || '7200000'); // 2 hours default

  /**
   * Create a new session
   */
  createSession(params: CreateSessionParams): string {
    const sessionId = randomUUID();
    const now = Date.now();

    const session: Session = {
      sessionId,
      fixtureId: params.fixtureId,
      createdAt: now,
      status: 'pending',
      collectedData: {},
      partialReports: {},
      categoryReports: {},
      finalReport: null,
      chatHistory: [],
    };

    this.sessions.set(sessionId, session);
    console.log(`✓ Session created: ${sessionId} for fixture ${params.fixtureId}`);

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (Date.now() - session.createdAt > this.SESSION_TTL) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, updates: UpdateSessionParams): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      console.warn(`⚠️  Session not found: ${sessionId}`);
      return false;
    }

    if (updates.status) {
      session.status = updates.status;
    }

    if (updates.error) {
      session.error = updates.error;
    }

    if (updates.collectedData) {
      session.collectedData = {
        ...session.collectedData,
        ...updates.collectedData,
      };
    }

    if (updates.partialReport) {
      session.partialReports[updates.partialReport.key] = updates.partialReport.report;
    }

    if (updates.categoryReport) {
      session.categoryReports[updates.categoryReport.key] = updates.categoryReport.report;
    }

    if (updates.finalReport) {
      session.finalReport = updates.finalReport;
    }

    if (updates.chatMessage) {
      session.chatHistory.push(updates.chatMessage);
    }

    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`✓ Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.SESSION_TTL) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`✓ Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  }

  /**
   * Get all active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session statistics
   */
  getStats() {
    const statuses = {
      pending: 0,
      generating: 0,
      completed: 0,
      error: 0,
    };

    for (const session of this.sessions.values()) {
      statuses[session.status]++;
    }

    return {
      total: this.sessions.size,
      statuses,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Auto cleanup every 30 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 30 * 60 * 1000);
