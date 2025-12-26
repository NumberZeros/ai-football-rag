import {
  APIFootballResponse,
  FixtureData,
  FixtureStatistics,
  Injury,
  Lineup,
  Standing,
  H2HMatch,
  GetFixturesParams,
  GetStatisticsParams,
  GetInjuriesParams,
  GetLineupsParams,
  GetH2HParams,
  GetStandingsParams,
  PredictionData,
  GetPredictionsParams,
} from './types';
import { apiFootballCache } from './cache';

// Rate limit metadata captured from API-Football response headers
export interface RateLimitInfo {
  requestsRemaining?: number;
  requestsLimit?: number;
  retryAfter?: number; // seconds
}

export interface APIFootballResponseWithMeta<T> {
  data: APIFootballResponse<T>;
  rateLimit?: RateLimitInfo;
}

export class APIFootballError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIFootballError';
  }
}

class APIFootballClient {
  private baseURL: string;
  private apiKey: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseURL = process.env.APIFOOTBALL_BASE_URL || 'https://v3.football.api-sports.io';
    this.apiKey = process.env.APIFOOTBALL_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️  APIFOOTBALL_API_KEY not set in environment variables');
    }
  }

  /**
   * Make HTTP request with retry logic
   * Enforces GET-only requests and strict header policy per API-Football architecture
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {},
    attempt = 1
  ): Promise<APIFootballResponse<T>> {
    // Check cache first
    const cached = apiFootballCache.get<APIFootballResponse<T>>(endpoint, params);
    if (cached) {
      console.log(`✓ Cache hit: ${endpoint}`, params);
      return cached;
    }

    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`;

    try {
      console.log(`→ API-Football request [${attempt}/${this.maxRetries}]: ${endpoint}`, params);

      // Enforce GET method and only allowed headers (API-Football architecture requirement)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey,
        },
      });

      // Capture rate-limit headers (API-Football provides these)
      const rateLimit: RateLimitInfo = {
        requestsRemaining: response.headers.get('x-ratelimit-requests-remaining')
          ? parseInt(response.headers.get('x-ratelimit-requests-remaining')!)
          : undefined,
        requestsLimit: response.headers.get('x-ratelimit-requests-limit')
          ? parseInt(response.headers.get('x-ratelimit-requests-limit')!)
          : undefined,
      };

      if (rateLimit.requestsRemaining !== undefined) {
        console.log(`ℹ️  Rate limit: ${rateLimit.requestsRemaining}/${rateLimit.requestsLimit} remaining`);
      }

      if (!response.ok) {
        if (response.status === 429) {
          // Respect Retry-After header if provided, otherwise exponential backoff
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.retryDelay * Math.pow(2, attempt - 1);
          
          if (attempt < this.maxRetries) {
            console.log(`⏳ Rate limited (429), retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.request<T>(endpoint, params, attempt + 1);
          } else {
            throw new APIFootballError(
              `Rate limit exceeded. Requests remaining: ${rateLimit.requestsRemaining || 0}/${rateLimit.requestsLimit || 'unknown'}`,
              429,
              endpoint
            );
          }
        }

        if (response.status === 401) {
          throw new APIFootballError(
            'Invalid API key. Please check APIFOOTBALL_API_KEY environment variable.',
            401,
            endpoint
          );
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          // Server error - retry
          const delay = this.retryDelay * attempt;
          console.log(`⏳ Server error, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, params, attempt + 1);
        }

        throw new APIFootballError(
          `API-Football request failed: ${response.status} ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const data: APIFootballResponse<T> = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        // Check if it's a rate limit error in the response body
        const errors = data.errors as any;
        if (errors.rateLimit && attempt < this.maxRetries) {
          console.log(`⏳ Rate limit error in response, waiting 12 seconds before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 12000)); // Wait 12s for rate limit reset
          return this.request<T>(endpoint, params, attempt + 1);
        }
        
        throw new APIFootballError(
          `API-Football returned errors: ${JSON.stringify(data.errors)}`,
          undefined,
          endpoint
        );
      }

      // Cache successful response
      apiFootballCache.set(endpoint, params, data);
      console.log(`✓ API-Football success: ${endpoint}`, { results: data.results });

      return data;
    } catch (error) {
      if (error instanceof APIFootballError) {
        throw error;
      }

      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * attempt;
        console.log(`⏳ Request failed, retrying in ${delay}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(endpoint, params, attempt + 1);
      }

      throw new APIFootballError(
        `API-Football request failed after ${this.maxRetries} attempts: ${error}`,
        undefined,
        endpoint
      );
    }
  }

  /**
   * Get fixtures (list or by ID)
   */
  async getFixtures(params: GetFixturesParams): Promise<FixtureData[]> {
    const response = await this.request<FixtureData[]>('/fixtures', params);
    return response.response;
  }

  /**
   * Get fixture statistics
   */
  async getStatistics(params: GetStatisticsParams): Promise<FixtureStatistics[]> {
    const response = await this.request<FixtureStatistics[]>('/fixtures/statistics', params);
    return response.response;
  }

  /**
   * Get injuries
   */
  async getInjuries(params: GetInjuriesParams): Promise<Injury[]> {
    const response = await this.request<Injury[]>('/injuries', params);
    return response.response;
  }

  /**
   * Get lineups
   */
  async getLineups(params: GetLineupsParams): Promise<Lineup[]> {
    const response = await this.request<Lineup[]>('/fixtures/lineups', params);
    return response.response;
  }

  /**
   * Get head-to-head matches
   */
  async getH2H(params: GetH2HParams): Promise<H2HMatch[]> {
    const response = await this.request<H2HMatch[]>('/fixtures/headtohead', params);
    return response.response;
  }

  /**
   * Get league standings
   */
  async getStandings(params: GetStandingsParams): Promise<Standing[][]> {
    const response = await this.request<{ league: { standings: Standing[][] } }[]>(
      '/standings',
      params
    );
    return response.response[0]?.league?.standings || [];
  }

  /**
   * Get AI predictions for a fixture
   */
  async getPredictions(params: GetPredictionsParams): Promise<PredictionData | null> {
    try {
      const response = await this.request<PredictionData[]>('/predictions', params);
      return response.response[0] || null;
    } catch (error) {
      // Predictions might not be available for all fixtures
      console.log(`No predictions available for fixture ${params.fixture}`);
      return null;
    }
  }
}

// Singleton instance
export const apiFootballClient = new APIFootballClient();
