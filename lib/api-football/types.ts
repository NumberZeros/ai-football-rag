// API-Football Response Types
export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

export interface FixtureData {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface FixtureStatistics {
  team: Team;
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

export interface Injury {
  player: {
    id: number;
    name: string;
    photo: string;
    type: string;
    reason: string;
  };
  team: Team;
  fixture: Fixture;
  league: League;
}

export interface Lineup {
  team: Team;
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string | null;
    };
  }>;
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface H2HMatch extends FixtureData {}

// Request parameter types
export interface GetFixturesParams {
  id?: number;
  date?: string;
  league?: number;
  season?: number;
  team?: number;
  last?: number;
  next?: number;
  from?: string;
  to?: string;
  status?: string;
}

export interface GetStatisticsParams {
  fixture: number;
}

export interface GetInjuriesParams {
  fixture?: number;
  team?: number;
  league?: number;
  season?: number;
}

export interface GetLineupsParams {
  fixture: number;
}

export interface GetH2HParams {
  h2h: string; // "teamId1-teamId2"
}

export interface GetStandingsParams {
  league: number;
  season: number;
  team?: number;
}

// Predictions API types
export interface Prediction {
  winner: {
    id: number | null;
    name: string;
    comment: string;
  };
  win_or_draw: boolean;
  under_over: string | null;
  goals: {
    home: string;
    away: string;
  };
  advice: string;
  percent: {
    home: string;
    draw: string;
    away: string;
  };
}

export interface PredictionComparison {
  form: {
    home: string;
    away: string;
  };
  att: {
    home: string;
    away: string;
  };
  def: {
    home: string;
    away: string;
  };
  poisson_distribution: {
    home: string;
    away: string;
  };
  h2h: {
    home: string;
    away: string;
  };
  goals: {
    home: string;
    away: string;
  };
  total: {
    home: string;
    away: string;
  };
}

export interface PredictionData {
  predictions: Prediction;
  league: League;
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: {
            total: number;
            average: string;
          };
          against: {
            total: number;
            average: string;
          };
        };
      };
      league: {
        form: string;
        fixtures: {
          played: {
            home: number;
            away: number;
            total: number;
          };
          wins: {
            home: number;
            away: number;
            total: number;
          };
          draws: {
            home: number;
            away: number;
            total: number;
          };
          loses: {
            home: number;
            away: number;
            total: number;
          };
        };
        goals: {
          for: {
            total: {
              home: number;
              away: number;
              total: number;
            };
            average: {
              home: string;
              away: string;
              total: string;
            };
          };
          against: {
            total: {
              home: number;
              away: number;
              total: number;
            };
            average: {
              home: string;
              away: string;
              total: string;
            };
          };
        };
        biggest: {
          streak: {
            wins: number;
            draws: number;
            loses: number;
          };
          wins: {
            home: string;
            away: string;
          };
          loses: {
            home: string;
            away: string;
          };
          goals: {
            for: {
              home: number;
              away: number;
            };
            against: {
              home: number;
              away: number;
            };
          };
        };
        clean_sheet: {
          home: number;
          away: number;
          total: number;
        };
        failed_to_score: {
          home: number;
          away: number;
          total: number;
        };
      };
    };
    away: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: {
            total: number;
            average: string;
          };
          against: {
            total: number;
            average: string;
          };
        };
      };
      league: {
        form: string;
        fixtures: {
          played: {
            home: number;
            away: number;
            total: number;
          };
          wins: {
            home: number;
            away: number;
            total: number;
          };
          draws: {
            home: number;
            away: number;
            total: number;
          };
          loses: {
            home: number;
            away: number;
            total: number;
          };
        };
        goals: {
          for: {
            total: {
              home: number;
              away: number;
              total: number;
            };
            average: {
              home: string;
              away: string;
              total: string;
            };
          };
          against: {
            total: {
              home: number;
              away: number;
              total: number;
            };
            average: {
              home: string;
              away: string;
              total: string;
            };
          };
        };
        biggest: {
          streak: {
            wins: number;
            draws: number;
            loses: number;
          };
          wins: {
            home: string;
            away: string;
          };
          loses: {
            home: string;
            away: string;
          };
          goals: {
            for: {
              home: number;
              away: number;
            };
            against: {
              home: number;
              away: number;
            };
          };
        };
        clean_sheet: {
          home: number;
          away: number;
          total: number;
        };
        failed_to_score: {
          home: number;
          away: number;
          total: number;
        };
      };
    };
  };
  comparison: PredictionComparison;
  h2h: H2HMatch[];
}

export interface GetPredictionsParams {
  fixture: number;
}
