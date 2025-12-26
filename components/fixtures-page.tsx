'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { FixtureData } from '@/lib/api-football/types';
import ApiKeyInput from '@/components/api-key-input';

// Top leagues with ranking (for sorting by attractiveness)
const TOP_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England', tier: 1, emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', country: 'Spain', tier: 1, emoji: '🇪🇸' },
  { id: 78, name: 'Bundesliga', country: 'Germany', tier: 1, emoji: '🇩🇪' },
  { id: 135, name: 'Serie A', country: 'Italy', tier: 1, emoji: '🇮🇹' },
  { id: 61, name: 'Ligue 1', country: 'France', tier: 1, emoji: '🇫🇷' },
  { id: 2, name: 'Champions League', country: 'UEFA', tier: 1, emoji: '🏆' },
  { id: 3, name: 'Europa League', country: 'UEFA', tier: 2, emoji: '🏆' },
  { id: 848, name: 'Conference League', country: 'UEFA', tier: 2, emoji: '🏆' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands', tier: 2, emoji: '🇳🇱' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal', tier: 2, emoji: '🇵🇹' },
];

export default function FixturesPage() {
  const router = useRouter();
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [filteredFixtures, setFilteredFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFixtureId, setGeneratingFixtureId] = useState<number | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [leagueCounts, setLeagueCounts] = useState<Record<number, number>>({});
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<any>(null);

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      // No client-side date filtering.
      const response = await fetch('/api/fixtures');
      const data = await response.json();

      if (!response.ok) {
        // Handle rate-limit errors gracefully
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        throw new Error(data.error || 'Failed to fetch fixtures');
      }

      setFixtures(data.fixtures || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFixtures = useCallback(() => {
    let filtered = [...fixtures];

    // Calculate fixture counts per league for filter buttons
    const counts: Record<number, number> = {};
    fixtures.forEach(f => {
      counts[f.league.id] = (counts[f.league.id] || 0) + 1;
    });
    setLeagueCounts(counts);

    // Filter by league if selected (client-side filtering for latest data)
    if (selectedLeague !== null) {
      filtered = filtered.filter(f => f.league.id === selectedLeague);
    }

    // Sort by attractiveness (tier + league ranking)
    filtered.sort((a, b) => {
      const leagueATier = TOP_LEAGUES.find(l => l.id === a.league.id)?.tier || 99;
      const leagueBTier = TOP_LEAGUES.find(l => l.id === b.league.id)?.tier || 99;
      
      // First sort by tier (lower is better)
      if (leagueATier !== leagueBTier) {
        return leagueATier - leagueBTier;
      }

      // Then sort by match status (live first, then upcoming)
      const statusA = a.fixture.status.short;
      const statusB = b.fixture.status.short;
      const isLiveA = statusA === '1H' || statusA === '2H' || statusA === 'HT';
      const isLiveB = statusB === '1H' || statusB === '2H' || statusB === 'HT';

      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;

      // Finally sort by date (earliest first)
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });

    setFilteredFixtures(filtered);
  }, [fixtures, selectedLeague]);

  useEffect(() => {
    filterAndSortFixtures();
  }, [filterAndSortFixtures]);

  const handleGenerate = async (fixtureId: number) => {
    try {
      setGeneratingFixtureId(fixtureId);
      setRateLimitError(null);

      // Create session
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtureId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit error
        if (response.status === 429) {
          setRateLimitError(data);
          setShowApiKeyModal(true);
          setGeneratingFixtureId(null);
          return;
        }
        throw new Error(data.error || 'Failed to create session');
      }

      // Navigate to report page with custom API key if provided
      const url = customApiKey 
        ? `/report/${data.sessionId}?customApiKey=${encodeURIComponent(customApiKey)}`
        : `/report/${data.sessionId}`;
      router.push(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate report');
      setGeneratingFixtureId(null);
    }
  };

  const handleApiKeySubmit = (apiKey: string) => {
    setCustomApiKey(apiKey);
    setRateLimitError(null);
    // Retry generating if there was a rate limit error
    if (generatingFixtureId) {
      handleGenerate(generatingFixtureId);
    }
  };

  if (loading) {
    return (
      <FadeIn>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="h-9 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
          <StaggerContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <StaggerItem key={i}>
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 animate-pulse">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-4" />
                    <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                    <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
                    <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </FadeIn>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 p-6 text-center"
      >
        <p className="text-red-900 dark:text-red-100 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchFixtures}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  if (filteredFixtures.length === 0) {
    const selectedLeagueName = TOP_LEAGUES.find(l => l.id === selectedLeague)?.name;
    return (
      <div>
        <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLeague(null)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedLeague === null
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All leagues
              <span className="text-xs opacity-70">({fixtures.length})</span>
            </button>
            {TOP_LEAGUES.map((league) => {
              const count = leagueCounts[league.id] || 0;
              const isActive = selectedLeague === league.id;
              return (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  disabled={count === 0}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                      : count === 0
                      ? 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900/40 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {league.name}
                  {count > 0 && <span className="text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 text-center">
          <p className="text-zinc-700 dark:text-zinc-300 text-base sm:text-lg">
            {selectedLeagueName ? `No fixtures found for ${selectedLeagueName}.` : 'No fixtures found.'}
          </p>
          {selectedLeague && (
            <button
              onClick={() => setSelectedLeague(null)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
            >
              Show All Leagues
            </button>
          )}
        </div>
      </div>
    );
  }

  // Group fixtures by league
  const fixturesByLeague = filteredFixtures.reduce((acc, fixture) => {
    const leagueId = fixture.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        fixtures: [],
      };
    }
    acc[leagueId].fixtures.push(fixture);
    return acc;
  }, {} as Record<number, { league: FixtureData['league']; fixtures: FixtureData[] }>);

  return (
    <div>
      <FadeIn>
        <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLeague(null)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedLeague === null
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All leagues
              <span className="text-xs opacity-70">({fixtures.length})</span>
            </motion.button>
            {TOP_LEAGUES.map((league) => {
              const count = leagueCounts[league.id] || 0;
              const isActive = selectedLeague === league.id;
              return (
                <motion.button
                  key={league.id}
                  whileHover={count > 0 ? { scale: 1.05 } : {}}
                  whileTap={count > 0 ? { scale: 0.95 } : {}}
                  onClick={() => setSelectedLeague(league.id)}
                  disabled={count === 0}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                      : count === 0
                      ? 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900/40 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {league.name}
                  {count > 0 && <span className="text-xs opacity-70">({count})</span>}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Showing {filteredFixtures.length} of {fixtures.length}
            {selectedLeague && ` • ${TOP_LEAGUES.find(l => l.id === selectedLeague)?.name}`}
          </div>
        </div>
      </FadeIn>

      {/* Fixtures grouped by league */}
      <div className="space-y-8">
        {Object.values(fixturesByLeague).map(({ league, fixtures }) => {
          return (
            <div key={league.id}>
              {/* League Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <img
                  src={league.logo}
                  alt={league.name}
                  className="w-8 h-8"
                />
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {league.name}
                </h2>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {league.country}
                </span>
              </div>

              {/* Fixtures Grid */}
              <StaggerContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fixtures.map((fixture) => {
                    const isGenerating = generatingFixtureId === fixture.fixture.id;
                    const matchDate = new Date(fixture.fixture.date);
                    const isLive = fixture.fixture.status.short === '1H' || fixture.fixture.status.short === '2H';
                    const isFinished = fixture.fixture.status.short === 'FT';

                    return (
                      <StaggerItem key={fixture.fixture.id}>
                        <motion.div
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 h-full"
                        >
                      {/* Teams */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={fixture.teams.home.logo}
                              alt={fixture.teams.home.name}
                              className="w-8 h-8"
                            />
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {fixture.teams.home.name}
                            </span>
                          </div>
                          {fixture.goals.home !== null && (
                            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                              {fixture.goals.home}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={fixture.teams.away.logo}
                              alt={fixture.teams.away.name}
                              className="w-8 h-8"
                            />
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {fixture.teams.away.name}
                            </span>
                          </div>
                          {fixture.goals.away !== null && (
                            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                              {fixture.goals.away}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Info */}
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        <div className="flex items-center gap-2">
                          <span>{matchDate.toLocaleString()}</span>
                        </div>
                        {fixture.fixture.venue.name && (
                          <div className="flex items-center gap-2 mt-1">
                            <span>{fixture.fixture.venue.name}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          {isLive && (
                            <span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
                              LIVE
                            </span>
                          )}
                          {isFinished && (
                            <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                              FT
                            </span>
                          )}
                          {!isLive && !isFinished && (
                            <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                              {fixture.fixture.status.long}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <motion.button
                        whileHover={!isGenerating ? { scale: 1.02 } : {}}
                        whileTap={!isGenerating ? { scale: 0.98 } : {}}
                        onClick={() => handleGenerate(fixture.fixture.id)}
                        disabled={isGenerating}
                        className={`
                          w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors
                          ${
                            isGenerating
                              ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500 cursor-not-allowed'
                              : 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200'
                          }
                        `}
                      >
                        {isGenerating ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.svg
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </motion.svg>
                            Generating...
                          </span>
                        ) : (
                          'Generate report'
                        )}
                      </motion.button>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerContainer>
            </div>
          );
        })}
      </div>

      {/* API Key Input Modal */}
      <ApiKeyInput
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onApiKeySubmit={handleApiKeySubmit}
      />

      {/* Rate Limit Warning Banner */}
      {rateLimitError && !showApiKeyModal && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 shadow-lg z-40"
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                Rate Limit Reached
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {rateLimitError.error}
              </p>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline"
              >
                Use your own API key →
              </button>
            </div>
            <button
              onClick={() => setRateLimitError(null)}
              className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
