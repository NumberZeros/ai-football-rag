export interface SignalDefinition {
  id: string;
  name: string;
  description: string;
  dataRequirements: string[];
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  signals: SignalDefinition[];
}

export const REPORT_BLUEPRINT: CategoryDefinition[] = [
  {
    id: 'game_context',
    name: 'Game Context',
    description: 'Essential match information and context',
    emoji: '⚽',
    signals: [
      {
        id: 'home_vs_away',
        name: 'Home vs Away Analysis',
        description: 'Team names, venue advantage, and basic matchup info',
        dataRequirements: ['fixture'],
      },
      {
        id: 'competition_round_schedule',
        name: 'Competition Context',
        description: 'League, round, season context, and schedule positioning',
        dataRequirements: ['fixture', 'standings'],
      },
      {
        id: 'kickoff_weather_pitch',
        name: 'Match Conditions',
        description: 'Kickoff time, weather conditions, pitch status',
        dataRequirements: ['fixture'],
      },
    ],
  },
  {
    id: 'team_context',
    name: 'Team Context',
    description: 'Recent form and tactical trends',
    emoji: '📊',
    signals: [
      {
        id: 'recent_form_results',
        name: 'Recent Form & Results',
        description: 'Last 5-10 matches for each team, win/loss patterns',
        dataRequirements: ['standings', 'h2h'],
      },
      {
        id: 'tactical_shape_trends',
        name: 'Tactical Shape & Trends',
        description: 'Formation preferences, style of play, tactical evolution',
        dataRequirements: ['lineups', 'statistics'],
      },
    ],
  },
  {
    id: 'key_players',
    name: 'Key Players',
    description: 'Critical players and lineup information',
    emoji: '⭐',
    signals: [
      {
        id: 'key_players_lineup',
        name: 'Key Players & Expected Lineup',
        description: 'Star players, probable starting XI, tactical roles',
        dataRequirements: ['lineups', 'statistics'],
      },
      {
        id: 'injury_report',
        name: 'Injuries & Suspensions',
        description: 'Unavailable players, impact on team strength',
        dataRequirements: ['injuries'],
      },
    ],
  },
  {
    id: 'tactical_battle',
    name: 'Tactical Battle',
    description: 'Strategic matchups and managerial approach',
    emoji: '🎯',
    signals: [
      {
        id: 'managerial_approach',
        name: 'Managerial Approach',
        description: 'Coach philosophy, recent tactical decisions',
        dataRequirements: ['lineups', 'statistics'],
      },
      {
        id: 'matchup_analysis',
        name: 'Key Matchups',
        description: 'Position-by-position battles, tactical weaknesses to exploit',
        dataRequirements: ['lineups', 'statistics'],
      },
    ],
  },
  {
    id: 'psych_context',
    name: 'Psychological Context',
    description: 'Mental factors and historical context',
    emoji: '🧠',
    signals: [
      {
        id: 'motivation_factors',
        name: 'Motivation & Stakes',
        description: 'What each team is playing for, psychological drivers',
        dataRequirements: ['fixture', 'standings'],
      },
      {
        id: 'h2h_history_psychology',
        name: 'Head-to-Head Psychology',
        description: 'Recent H2H results, psychological edge, historical trends',
        dataRequirements: ['h2h'],
      },
    ],
  },
];

/**
 * Get all signals across all categories
 */
export function getAllSignals(): Array<{ categoryId: string; signal: SignalDefinition }> {
  const signals: Array<{ categoryId: string; signal: SignalDefinition }> = [];
  
  for (const category of REPORT_BLUEPRINT) {
    for (const signal of category.signals) {
      signals.push({ categoryId: category.id, signal });
    }
  }
  
  return signals;
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): CategoryDefinition | undefined {
  return REPORT_BLUEPRINT.find((cat) => cat.id === categoryId);
}

/**
 * Get signal by category and signal ID
 */
export function getSignalById(categoryId: string, signalId: string): SignalDefinition | undefined {
  const category = getCategoryById(categoryId);
  return category?.signals.find((sig) => sig.id === signalId);
}

/**
 * Get total signal count
 */
export function getTotalSignalCount(): number {
  return REPORT_BLUEPRINT.reduce((sum, cat) => sum + cat.signals.length, 0);
}
