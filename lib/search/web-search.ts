import { tavily } from '@tavily/core';

export interface WebSearchResult {
  success: boolean;
  results?: Array<{
    title: string;
    content: string;
    url: string;
    score?: number;
  }>;
  error?: string;
}

export class WebSearchClient {
  private client?: ReturnType<typeof tavily>;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.TAVILY_API_KEY;
    this.enabled = !!apiKey;
    
    if (this.enabled) {
      this.client = tavily({ apiKey });
    } else {
      console.warn('⚠️  TAVILY_API_KEY not set. Web search will be disabled.');
    }
  }

  async search(
    query: string,
    options?: {
      maxResults?: number;
      searchDepth?: 'basic' | 'advanced';
      includeImages?: boolean;
      includeDomains?: string[];
      excludeDomains?: string[];
    }
  ): Promise<WebSearchResult> {
    if (!this.enabled || !this.client) {
      return {
        success: false,
        error: 'Web search is disabled (TAVILY_API_KEY not configured)',
      };
    }

    try {
      const response = await this.client.search(query, {
        max_results: options?.maxResults ?? 5,
        search_depth: options?.searchDepth ?? 'basic',
        include_images: options?.includeImages ?? false,
        include_domains: options?.includeDomains,
        exclude_domains: options?.excludeDomains,
      });

      return {
        success: true,
        results: response.results.map((r: any) => ({
          title: r.title,
          content: r.content,
          url: r.url,
          score: r.score,
        })),
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Web search failed',
      };
    }
  }

  /**
   * Search for recent football/soccer news
   */
  async searchFootballNews(teamOrLeague: string, maxResults = 3): Promise<WebSearchResult> {
    const query = `${teamOrLeague} football news latest injuries transfers form`;
    return this.search(query, {
      maxResults,
      searchDepth: 'basic',
      includeDomains: ['bbc.com', 'espn.com', 'skysports.com', 'theguardian.com', 'goal.com'],
    });
  }

  /**
   * Search for match-specific context
   */
  async searchMatchContext(
    homeTeam: string,
    awayTeam: string,
    maxResults = 3
  ): Promise<WebSearchResult> {
    const query = `${homeTeam} vs ${awayTeam} preview prediction analysis`;
    return this.search(query, {
      maxResults,
      searchDepth: 'basic',
    });
  }
}

export const webSearchClient = new WebSearchClient();
