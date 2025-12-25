import { sessionManager } from '../session/manager';
import { Session, PartialReport, CategoryReport } from '../session/types';
import { APIFootballProxy } from '../api-football/proxy';
import { REPORT_BLUEPRINT, getAllSignals, getCategoryById } from '../report/blueprint';
import { ProgressTracker, ProgressCallback } from './progress-tracker';
import {
  analyzeSignal,
  formatCollectedDataForSignal,
} from '../llm/chains/signal-chain';
import {
  mergeCategory,
  formatPartialReportsForCategory,
} from '../llm/chains/category-chain';
import {
  synthesizeFinalReport,
  formatCategoryReportsForFinal,
  formatFinalReportAsMarkdown,
} from '../llm/chains/final-chain';

/**
 * Simple throttle utility to control API request rate
 * Ensures minimum delay between consecutive API calls
 */
class RequestThrottle {
  private lastRequestTime = 0;
  private minDelayMs: number;

  constructor(requestsPerMinute: number = 30) {
    // Calculate minimum delay to stay within rate limit
    this.minDelayMs = Math.ceil(60000 / requestsPerMinute);
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelayMs) {
      const delayNeeded = this.minDelayMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }
}

export class ReportGenerator {
  private sessionId: string;
  private progressCallback: ProgressCallback;
  private throttle: RequestThrottle;
  private signalConcurrency: number;

  constructor(sessionId: string, progressCallback: ProgressCallback) {
    this.sessionId = sessionId;
    this.progressCallback = progressCallback;
    // API-Football free plans can be as low as ~10 requests/minute.
    // Keep a safety margin to reduce 429 retries.
    const rpm = Number.parseInt(process.env.APIFOOTBALL_REQUESTS_PER_MINUTE || '8', 10);
    this.throttle = new RequestThrottle(Number.isFinite(rpm) && rpm > 0 ? rpm : 8);
    // LLM calls are the slowest step; allow small parallelism.
    this.signalConcurrency = 2;
  }

  /**
   * Main orchestration method - generates complete report
   */
  async generate(): Promise<void> {
    const session = sessionManager.getSession(this.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${this.sessionId}`);
    }

    const allSignals = getAllSignals();
    const tracker = new ProgressTracker(
      allSignals.length,
      REPORT_BLUEPRINT.length,
      this.progressCallback
    );

    try {
      // Update session status
      sessionManager.updateSession(this.sessionId, { status: 'generating' });

      // Stage 1: Data Collection (0-20%)
      await this.collectData(session, tracker);

      // Stage 2: Signal Generation (20-70%)
      await this.generateSignals(session, tracker);

      // Stage 3: Category Merge (70-90%)
      await this.mergeCategories(session, tracker);

      // Stage 4: Final Synthesis (90-100%)
      await this.synthesizeFinal(session, tracker);

      // Mark as completed
      sessionManager.updateSession(this.sessionId, { status: 'completed' });
      
      this.progressCallback({
        stage: 'final_synthesis',
        progress: 100,
        message: 'Report generation completed!',
      });
    } catch (error) {
      console.error('Report generation error:', error);
      sessionManager.updateSession(this.sessionId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Stage 1: Collect all required data from API-Football
   */
  private async collectData(session: Session, tracker: ProgressTracker): Promise<void> {
    tracker.emitDataCollection('Fetching fixture details...');

    // Get fixture details
    await this.throttle.throttle();
    const fixtureResult = await APIFootballProxy.getFixtures({ id: session.fixtureId });
    if (fixtureResult.success && fixtureResult.data && fixtureResult.data.length > 0) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { fixture: fixtureResult.data[0] },
      });
    } else {
      throw new Error('Failed to fetch fixture details');
    }

    const fixture = fixtureResult.data[0];
    const homeTeamId = fixture.teams.home.id;
    const awayTeamId = fixture.teams.away.id;

    // Get statistics
    tracker.emitDataCollection('Fetching match statistics...');
    await this.throttle.throttle();
    const statsResult = await APIFootballProxy.getStatistics({ fixture: session.fixtureId });
    if (statsResult.success && statsResult.data) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { statistics: statsResult.data },
      });
    }

    // Get injuries
    tracker.emitDataCollection('Fetching injury reports...');
    await this.throttle.throttle();
    const injuriesResult = await APIFootballProxy.getInjuries({ fixture: session.fixtureId });
    if (injuriesResult.success && injuriesResult.data) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { injuries: injuriesResult.data },
      });
    }

    // Get lineups
    tracker.emitDataCollection('Fetching team lineups...');
    await this.throttle.throttle();
    const lineupsResult = await APIFootballProxy.getLineups({ fixture: session.fixtureId });
    if (lineupsResult.success && lineupsResult.data) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { lineups: lineupsResult.data },
      });
    }

    // Get H2H
    tracker.emitDataCollection('Fetching head-to-head history...');
    await this.throttle.throttle();
    const h2hResult = await APIFootballProxy.getH2H({ h2h: `${homeTeamId}-${awayTeamId}` });
    if (h2hResult.success && h2hResult.data) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { h2h: h2hResult.data },
      });
    }

    // Get standings
    tracker.emitDataCollection('Fetching league standings...');
    await this.throttle.throttle();
    const standingsResult = await APIFootballProxy.getStandings({
      league: fixture.league.id,
      season: fixture.league.season,
    });
    if (standingsResult.success && standingsResult.data) {
      sessionManager.updateSession(this.sessionId, {
        collectedData: { standings: standingsResult.data },
      });
    } else if (!standingsResult.success && standingsResult.error?.includes('Free plans')) {
      // Free plan season restriction - try last available season (2023)
      console.log('⚠️  Current season not available on free plan, trying 2023...');
      const fallbackResult = await APIFootballProxy.getStandings({
        league: fixture.league.id,
        season: 2023,
      });
      if (fallbackResult.success && fallbackResult.data) {
        sessionManager.updateSession(this.sessionId, {
          collectedData: { standings: fallbackResult.data },
        });
      }
    }

    tracker.emitDataCollection('Data collection completed');
  }

  /**
   * Stage 2: Generate signal-level reports
   */
  private async generateSignals(session: Session, tracker: ProgressTracker): Promise<void> {
    const allSignals = getAllSignals();
    const updatedSession = sessionManager.getSession(this.sessionId);
    if (!updatedSession) throw new Error('Session lost');

    const fixture = updatedSession.collectedData.fixture;
    if (!fixture) throw new Error('Fixture data not available');

    const tasks = allSignals.map(({ categoryId, signal }) => async () => {
      tracker.emitSignalStart(categoryId, signal.id, signal.name);

      try {
        // Always read the latest session snapshot (other tasks may have updated it).
        const latestSession = sessionManager.getSession(this.sessionId);
        if (!latestSession) throw new Error('Session lost');
        const latestFixture = latestSession.collectedData.fixture;
        if (!latestFixture) throw new Error('Fixture data not available');

        const collectedDataStr = formatCollectedDataForSignal(
          latestSession.collectedData,
          signal.dataRequirements
        );

        const result = await analyzeSignal({
          homeTeam: latestFixture.teams.home.name,
          awayTeam: latestFixture.teams.away.name,
          league: latestFixture.league.name,
          date: new Date(latestFixture.fixture.date).toLocaleDateString(),
          signalName: signal.name,
          signalDescription: signal.description,
          collectedData: collectedDataStr,
        });

        const partialReport: PartialReport = {
          categoryId,
          signalId: signal.id,
          title: signal.name,
          insights: result.insights,
          narrative: result.narrative,
          emoji: result.emoji,
          confidence: result.confidence,
        };

        sessionManager.updateSession(this.sessionId, {
          partialReport: {
            key: `${categoryId}.${signal.id}`,
            report: partialReport,
          },
        });

        tracker.emitSignalComplete(categoryId, signal.id);
      } catch (error) {
        console.error(`Failed to generate signal ${categoryId}.${signal.id}:`, error);
      }
    });

    let nextIndex = 0;
    const runWorker = async () => {
      while (nextIndex < tasks.length) {
        const current = nextIndex;
        nextIndex += 1;
        await tasks[current]();
      }
    };

    const workers = Array.from(
      { length: Math.min(this.signalConcurrency, tasks.length) },
      () => runWorker()
    );
    await Promise.all(workers);
  }

  /**
   * Stage 3: Merge signals into category reports
   */
  private async mergeCategories(session: Session, tracker: ProgressTracker): Promise<void> {
    const updatedSession = sessionManager.getSession(this.sessionId);
    if (!updatedSession) throw new Error('Session lost');

    const fixture = updatedSession.collectedData.fixture;
    if (!fixture) throw new Error('Fixture data not available');

    for (const category of REPORT_BLUEPRINT) {
      tracker.emitCategoryStart(category.id, category.name);

      try {
        // Get all partial reports for this category
        const partialReports = category.signals
          .map((signal) => updatedSession.partialReports[`${category.id}.${signal.id}`])
          .filter((report) => report !== undefined);

        if (partialReports.length === 0) {
          console.warn(`No partial reports for category ${category.id}`);
          continue;
        }

        // Format partial reports
        const formattedReports = formatPartialReportsForCategory(partialReports);

        // Merge with LLM
        const result = await mergeCategory({
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          categoryName: category.name,
          categoryEmoji: category.emoji,
          signalReports: formattedReports,
        });

        // Store category report
        const categoryReport: CategoryReport = {
          categoryId: category.id,
          title: result.title,
          sections: result.sections,
          talkingPoints: result.talkingPoints,
        };

        sessionManager.updateSession(this.sessionId, {
          categoryReport: {
            key: category.id,
            report: categoryReport,
          },
        });

        tracker.emitCategoryComplete(category.id);
      } catch (error) {
        console.error(`Failed to merge category ${category.id}:`, error);
        // Continue with other categories
      }
    }
  }

  /**
   * Stage 4: Synthesize final comprehensive report
   */
  private async synthesizeFinal(session: Session, tracker: ProgressTracker): Promise<void> {
    tracker.emitFinalSynthesis('Synthesizing final report...', 5);

    const updatedSession = sessionManager.getSession(this.sessionId);
    if (!updatedSession) throw new Error('Session lost');

    const fixture = updatedSession.collectedData.fixture;
    if (!fixture) throw new Error('Fixture data not available');

    try {
      // Format category reports
      const formattedCategories = formatCategoryReportsForFinal(updatedSession.categoryReports);

      tracker.emitFinalSynthesis('Generating comprehensive analysis...', 7);

      // Synthesize with LLM
      const result = await synthesizeFinalReport({
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        league: fixture.league.name,
        date: new Date(fixture.fixture.date).toLocaleDateString(),
        categoryReports: formattedCategories,
      });

      tracker.emitFinalSynthesis('Formatting final report...', 9);

      // Format as markdown
      const finalReport = formatFinalReportAsMarkdown(result);

      // Store final report
      sessionManager.updateSession(this.sessionId, {
        finalReport,
      });
    } catch (error) {
      console.error('Failed to synthesize final report:', error);
      throw error;
    }
  }
}

/**
 * Convenience function to generate a report
 */
export async function generateReport(
  sessionId: string,
  progressCallback: ProgressCallback
): Promise<void> {
  const generator = new ReportGenerator(sessionId, progressCallback);
  await generator.generate();
}
