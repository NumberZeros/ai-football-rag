import { RunnableSequence } from '@langchain/core/runnables';
import { getChatModel } from '../model-factory';
import { signalPromptTemplate } from '../prompts';
import { SignalReportSchema, SignalReportOutput } from '../schemas';
import { CollectedData } from '../../session/types';
import { truncateText } from '../utils/text';

export interface SignalChainInput {
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  signalName: string;
  signalDescription: string;
  collectedData: string; // JSON stringified relevant data
  [key: string]: any;
}

/**
 * Create a signal processing chain
 */
export function createSignalChain() {
  const model = getChatModel();
  const structuredModel = model.withStructuredOutput(SignalReportSchema, {
    strict: false,
    includeRaw: false,
  });

  return RunnableSequence.from([
    signalPromptTemplate,
    structuredModel,
  ]);
}

/**
 * Execute signal analysis with retry for incomplete JSON
 */
export async function analyzeSignal(input: SignalChainInput): Promise<SignalReportOutput> {
  const chain = createSignalChain();
  
  try {
    const result = await chain.invoke(input);
    
    // Validate that we have all required fields
    if (!result.narrative || !result.emoji || typeof result.confidence !== 'number') {
      console.warn(`⚠️  Incomplete result for signal "${input.signalName}", filling defaults...`);
      
      // Fill in missing fields with reasonable defaults
      return {
        insights: result.insights || [],
        narrative: result.narrative || 'No narrative available - data analysis in progress.',
        emoji: result.emoji || '⚽',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      };
    }
    
    return result as SignalReportOutput;
  } catch (error) {
    console.error(`Signal chain error for "${input.signalName}":`, error);
    
    // Return a safe fallback instead of throwing
    console.warn(`⚠️  Using fallback for signal "${input.signalName}"`);
    return {
      insights: [`Unable to analyze ${input.signalName} - data temporarily unavailable`],
      narrative: `Analysis for ${input.signalName} could not be completed at this time due to processing limitations.`,
      emoji: '⚽',
      confidence: 0.3,
    };
  }
}

/**
 * Helper to format collected data for a signal
 */
export function formatCollectedDataForSignal(
  collectedData: CollectedData,
  dataRequirements: string[]
): string {
  const relevantData: Record<string, unknown> = {};

  const fixture = collectedData.fixture;
  const homeTeamId = fixture?.teams.home.id;
  const awayTeamId = fixture?.teams.away.id;

  const compactStatistics = () => {
    const stats = collectedData.statistics ?? [];
    const keepTypes = new Set([
      'Shots on Goal',
      'Shots off Goal',
      'Total Shots',
      'Ball Possession',
      'Fouls',
      'Corner Kicks',
      'Offsides',
      'Yellow Cards',
      'Red Cards',
      'Total passes',
      'Passes accurate',
      'Passes %',
      'Expected Goals',
    ]);
    return stats.map((row) => ({
      team: { id: row.team.id, name: row.team.name },
      statistics: row.statistics
        .filter((s) => keepTypes.has(s.type))
        .slice(0, 20),
    }));
  };

  const compactInjuries = () => {
    const injuries = collectedData.injuries ?? [];
    return injuries.slice(0, 12).map((inj) => ({
      team: { id: inj.team.id, name: inj.team.name },
      player: {
        id: inj.player.id,
        name: inj.player.name,
        type: inj.player.type,
        reason: inj.player.reason,
      },
    }));
  };

  const compactLineups = () => {
    const lineups = collectedData.lineups ?? [];
    return lineups.slice(0, 2).map((lu) => ({
      team: { id: lu.team.id, name: lu.team.name },
      formation: lu.formation,
      coach: { id: lu.coach.id, name: lu.coach.name },
      startXI: lu.startXI.slice(0, 11).map((p) => ({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        pos: p.player.pos,
      })),
      substitutes: lu.substitutes.slice(0, 9).map((p) => ({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        pos: p.player.pos,
      })),
    }));
  };

  const compactH2H = () => {
    const h2h = (collectedData.h2h ?? []).slice(0, 5);
    return h2h.map((m) => ({
      fixture: {
        id: m.fixture.id,
        date: m.fixture.date,
        status: m.fixture.status,
      },
      league: {
        id: m.league.id,
        name: m.league.name,
        season: m.league.season,
      },
      teams: {
        home: { id: m.teams.home.id, name: m.teams.home.name },
        away: { id: m.teams.away.id, name: m.teams.away.name },
      },
      goals: m.goals,
      score: {
        halftime: m.score.halftime,
        fulltime: m.score.fulltime,
      },
    }));
  };

  const compactStandings = () => {
    const groups = collectedData.standings ?? [];
    const table = groups[0] ?? [];
    const importantTeamIds = new Set<number>(
      [homeTeamId, awayTeamId].filter((id): id is number => typeof id === 'number')
    );

    const top = table.slice(0, 8);
    const teamsRows = table.filter((row) => importantTeamIds.has(row.team.id));
    const merged = [...top, ...teamsRows].filter(
      (row, idx, arr) => arr.findIndex((r) => r.team.id === row.team.id) === idx
    );

    return merged.map((row) => ({
      rank: row.rank,
      team: { id: row.team.id, name: row.team.name },
      points: row.points,
      goalsDiff: row.goalsDiff,
      form: row.form,
      all: row.all,
    }));
  };

  for (const requirement of dataRequirements) {
    if (requirement === 'fixture' && collectedData.fixture) {
      relevantData.fixture = {
        teams: collectedData.fixture.teams,
        league: collectedData.fixture.league,
        venue: collectedData.fixture.fixture.venue,
        date: collectedData.fixture.fixture.date,
        status: collectedData.fixture.fixture.status,
      };
    }

    if (requirement === 'statistics' && collectedData.statistics) {
      relevantData.statistics = compactStatistics();
    }

    if (requirement === 'injuries' && collectedData.injuries) {
      relevantData.injuries = compactInjuries();
    }

    if (requirement === 'lineups' && collectedData.lineups) {
      relevantData.lineups = compactLineups();
    }

    if (requirement === 'h2h' && collectedData.h2h) {
      relevantData.h2h = compactH2H();
    }

    if (requirement === 'standings' && collectedData.standings) {
      relevantData.standings = compactStandings();
    }
  }

  // Keep the payload small; large JSON dramatically increases latency/cost.
  const json = JSON.stringify(relevantData);
  return truncateText(json, 14000);
}
