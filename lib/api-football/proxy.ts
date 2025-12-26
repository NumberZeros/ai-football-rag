import { apiFootballClient, APIFootballError } from './client';
import {
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

/**
 * Server-side proxy for API-Football
 * Provides error handling and normalization
 */
export class APIFootballProxy {
  /**
   * Get fixtures with error handling
   */
  static async getFixtures(params: GetFixturesParams): Promise<{
    success: boolean;
    data?: FixtureData[];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getFixtures(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getFixtures error:', error);
      
      if (error instanceof APIFootballError) {
        // Provide user-friendly messages for common errors
        let userMessage = error.message;
        if (error.statusCode === 429) {
          userMessage = 'API rate limit exceeded. Please try again in a moment.';
        } else if (error.statusCode === 401) {
          userMessage = 'API authentication failed. Please check configuration.';
        }
        
        return {
          success: false,
          error: userMessage,
          statusCode: error.statusCode,
        };
      }
      
      return {
        success: false,
        error: 'Failed to fetch fixtures. Please try again.',
      };
    }
  }

  /**
   * Get fixture statistics with error handling
   */
  static async getStatistics(params: GetStatisticsParams): Promise<{
    success: boolean;
    data?: FixtureStatistics[];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getStatistics(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getStatistics error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch statistics',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }

  /**
   * Get injuries with error handling
   */
  static async getInjuries(params: GetInjuriesParams): Promise<{
    success: boolean;
    data?: Injury[];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getInjuries(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getInjuries error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch injuries',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }

  /**
   * Get lineups with error handling
   */
  static async getLineups(params: GetLineupsParams): Promise<{
    success: boolean;
    data?: Lineup[];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getLineups(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getLineups error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch lineups',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }

  /**
   * Get head-to-head matches with error handling
   */
  static async getH2H(params: GetH2HParams): Promise<{
    success: boolean;
    data?: H2HMatch[];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getH2H(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getH2H error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch H2H data',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }

  /**
   * Get league standings with error handling
   */
  static async getStandings(params: GetStandingsParams): Promise<{
    success: boolean;
    data?: Standing[][];
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getStandings(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getStandings error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch standings',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }

  /**
   * Get AI predictions with error handling
   */
  static async getPredictions(params: GetPredictionsParams): Promise<{
    success: boolean;
    data?: PredictionData | null;
    error?: string;
    statusCode?: number;
  }> {
    try {
      const data = await apiFootballClient.getPredictions(params);
      return { success: true, data };
    } catch (error) {
      console.error('APIFootballProxy.getPredictions error:', error);
      return {
        success: false,
        error: error instanceof APIFootballError ? error.message : 'Failed to fetch predictions',
        statusCode: error instanceof APIFootballError ? error.statusCode : undefined,
      };
    }
  }
}
