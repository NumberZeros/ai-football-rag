import { FixtureData, FixtureStatistics, Injury, Lineup, H2HMatch, Standing } from '../api-football/types';

export type SessionStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PartialReport {
  categoryId: string;
  signalId: string;
  title: string;
  insights: string[];
  narrative: string;
  emoji: string;
  confidence: number;
}

export interface CategoryReport {
  categoryId: string;
  title: string;
  sections: Array<{
    title: string;
    content: string;
    emoji: string;
  }>;
  talkingPoints: string[];
}

export interface CollectedData {
  fixture?: FixtureData;
  statistics?: FixtureStatistics[];
  injuries?: Injury[];
  lineups?: Lineup[];
  h2h?: H2HMatch[];
  standings?: Standing[][];
}

export interface Session {
  sessionId: string;
  fixtureId: number;
  createdAt: number;
  status: SessionStatus;
  error?: string;
  
  // Collected data from API-Football
  collectedData: CollectedData;
  
  // Generated reports
  partialReports: Record<string, PartialReport>; // key: "category.signal"
  categoryReports: Record<string, CategoryReport>; // key: "category"
  finalReport: string | null;
  
  // Chat context
  chatHistory: ChatMessage[];
}

export interface CreateSessionParams {
  fixtureId: number;
}

export interface UpdateSessionParams {
  status?: SessionStatus;
  error?: string;
  collectedData?: Partial<CollectedData>;
  partialReport?: { key: string; report: PartialReport };
  categoryReport?: { key: string; report: CategoryReport };
  finalReport?: string;
  chatMessage?: ChatMessage;
}
