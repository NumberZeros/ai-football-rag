import { NextRequest, NextResponse } from 'next/server';
import { APIFootballProxy } from '@/lib/api-football/proxy';
import type { FixtureData, GetFixturesParams } from '@/lib/api-football/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Free plan allows access to yesterday, today, and tomorrow only (3 days)
const FREE_PLAN_WINDOW_DAYS = 3;
const MAX_DATE_RANGE_DAYS = 30;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDateList(from: string, to: string, maxDays: number): string[] {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date value.');
  }
  if (start.getTime() > end.getTime()) {
    throw new Error('Invalid date range: "from" date must be before or equal to "to" date');
  }

  const dates: string[] = [];
  for (let d = new Date(start); d.getTime() <= end.getTime(); ) {
    dates.push(formatDate(d));
    if (dates.length > maxDays) {
      throw new Error(`Date range exceeds maximum of ${maxDays} days`);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

function isFromToValidationError(message?: string): boolean {
  if (!message) return false;
  return message.includes('"from"') && message.includes('"to"') && message.includes('need another parameter');
}

function parsePlanAllowedRange(message?: string): { from: string; to: string } | null {
  if (!message) return null;
  // Example: Free plans do not have access to this date, try from 2025-12-24 to 2025-12-26.
  const match = message.match(/try\s+from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i);
  if (!match) return null;
  return { from: match[1], to: match[2] };
}

class PlanRestrictionError extends Error {
  public readonly from: string;
  public readonly to: string;

  constructor(from: string, to: string, message?: string) {
    super(message || `Plan restriction: allowed range is ${from} to ${to}`);
    this.name = 'PlanRestrictionError';
    this.from = from;
    this.to = to;
  }
}

async function getFixturesForDates(
  dates: string[],
  baseParams: Omit<GetFixturesParams, 'date' | 'from' | 'to'>
): Promise<FixtureData[]> {
  const byId = new Map<number, FixtureData>();

  // Keep concurrency low to reduce rate-limit risk.
  const CONCURRENCY = 3;
  let index = 0;

  async function worker() {
    while (index < dates.length) {
      const myIndex = index++;
      const date = dates[myIndex];
      const result = await APIFootballProxy.getFixtures({ ...baseParams, date });
      if (!result.success) {
        const allowed = parsePlanAllowedRange(result.error);
        if (allowed) {
          throw new PlanRestrictionError(allowed.from, allowed.to, result.error);
        }
        // Only log non-plan-restriction errors
        if (!result.error?.includes('plan') && !result.error?.includes('access')) {
          console.error(`Failed to fetch fixtures for ${date}:`, result.error);
        }
        throw new Error(result.error || 'Failed to fetch fixtures');
      }
      for (const fixture of result.data || []) {
        byId.set(fixture.fixture.id, fixture);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, dates.length) }, () => worker()));

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
}

/**
 * GET /api/fixtures - Get fixtures list
 * Query params:
 * - date: YYYY-MM-DD (single date, optional)
 * - from: YYYY-MM-DD (date range start, optional)
 * - to: YYYY-MM-DD (date range end, optional)
 * - league: league ID (optional)
 * - season: season year (optional)
 * - team: team ID (optional)
 * 
 * Note: Use either 'date' OR 'from/to' range, not both
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Support both single date and date range
    const dateParam = searchParams.get('date');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const league = searchParams.get('league');
    const season = searchParams.get('season');
    const team = searchParams.get('team');

    const baseParams: Omit<GetFixturesParams, 'date' | 'from' | 'to'> = {};
    if (league) baseParams.league = parseInt(league);
    if (season) baseParams.season = parseInt(season);
    if (team) baseParams.team = parseInt(team);

    // API-Football validates that `from/to` must be paired with another constraint (e.g., league/team).
    // We only use `from/to` when such a constraint exists. Otherwise we fetch multiple `date`s.
    const hasRangeConstraint =
      baseParams.league !== undefined || baseParams.team !== undefined || baseParams.season !== undefined;

    // Explicit range
    if (fromParam && toParam) {
      // If the request doesn't include an additional constraint, API-Football may reject from/to.
      // In that case, fallback to per-day date fetching (capped).
      const dates = buildDateList(fromParam, toParam, MAX_DATE_RANGE_DAYS);

      if (!hasRangeConstraint) {
        try {
          const fixtures = await getFixturesForDates(dates, baseParams);
          return NextResponse.json({ fixtures, count: fixtures.length });
        } catch (err) {
          if (err instanceof PlanRestrictionError) {
            const clamped = buildDateList(err.from, err.to, MAX_DATE_RANGE_DAYS);
            const fixtures = await getFixturesForDates(clamped, baseParams);
            return NextResponse.json({ fixtures, count: fixtures.length });
          }
          throw err;
        }
      }

      const result = await APIFootballProxy.getFixtures({ ...baseParams, from: fromParam, to: toParam });
      if (!result.success && isFromToValidationError(result.error)) {
        try {
          const fixtures = await getFixturesForDates(dates, baseParams);
          return NextResponse.json({ fixtures, count: fixtures.length });
        } catch (err) {
          if (err instanceof PlanRestrictionError) {
            const clamped = buildDateList(err.from, err.to, MAX_DATE_RANGE_DAYS);
            const fixtures = await getFixturesForDates(clamped, baseParams);
            return NextResponse.json({ fixtures, count: fixtures.length });
          }
          throw err;
        }
      }

      if (!result.success) {
        const allowed = parsePlanAllowedRange(result.error);
        if (allowed) {
          const clamped = buildDateList(allowed.from, allowed.to, MAX_DATE_RANGE_DAYS);
          const fixtures = await getFixturesForDates(clamped, baseParams);
          return NextResponse.json({ fixtures, count: fixtures.length });
        }
      }

      if (!result.success) {
        const statusCode = result.statusCode === 429 ? 429 : result.statusCode === 401 ? 401 : 500;
        return NextResponse.json(
          {
            error: result.error || 'Failed to fetch fixtures',
            statusCode: result.statusCode,
          },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        fixtures: result.data || [],
        count: result.data?.length || 0,
      });
    }

    // Explicit single date
    if (dateParam) {
      const result = await APIFootballProxy.getFixtures({ ...baseParams, date: dateParam });
      if (!result.success) {
        const statusCode = result.statusCode === 429 ? 429 : result.statusCode === 401 ? 401 : 500;
        return NextResponse.json(
          {
            error: result.error || 'Failed to fetch fixtures',
            statusCode: result.statusCode,
          },
          { status: statusCode }
        );
      }
      return NextResponse.json({
        fixtures: result.data || [],
        count: result.data?.length || 0,
      });
    }

    // Default behavior
    const today = new Date();

    if (hasRangeConstraint) {
      // With league/team constraint, range works and is the most efficient.
      // Use smaller window for free plans (today ±1 day = 3 days total)
      const start = new Date(today);
      start.setDate(start.getDate() - 1); // Start from yesterday
      const end = new Date(today);
      end.setDate(end.getDate() + 1); // End at tomorrow

      const from = formatDate(start);
      const to = formatDate(end);

      const result = await APIFootballProxy.getFixtures({
        ...baseParams,
        from,
        to,
      });

      if (!result.success && isFromToValidationError(result.error)) {
        const dates = buildDateList(from, to, MAX_DATE_RANGE_DAYS);
        try {
          const fixtures = await getFixturesForDates(dates, baseParams);
          return NextResponse.json({ fixtures, count: fixtures.length });
        } catch (err) {
          if (err instanceof PlanRestrictionError) {
            const clamped = buildDateList(err.from, err.to, MAX_DATE_RANGE_DAYS);
            const fixtures = await getFixturesForDates(clamped, baseParams);
            return NextResponse.json({ fixtures, count: fixtures.length });
          }
          throw err;
        }
      }

      if (!result.success) {
        const allowed = parsePlanAllowedRange(result.error);
        if (allowed) {
          const clamped = buildDateList(allowed.from, allowed.to, MAX_DATE_RANGE_DAYS);
          const fixtures = await getFixturesForDates(clamped, baseParams);
          return NextResponse.json({ fixtures, count: fixtures.length });
        }
      }

      if (!result.success) {
        const statusCode = result.statusCode === 429 ? 429 : result.statusCode === 401 ? 401 : 500;
        return NextResponse.json(
          {
            error: result.error || 'Failed to fetch fixtures',
            statusCode: result.statusCode,
          },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        fixtures: result.data || [],
        count: result.data?.length || 0,
      });
    }

    // No league/team constraint: fetch by date for the next N days and merge.
    // For free plans, use a narrow range (today ±1 day) to avoid plan restrictions
    const dates: string[] = [];
    
    // Generate yesterday, today, tomorrow (3 days total)
    for (let offset = -1; offset <= 1; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      dates.push(formatDate(d));
    }

    try {
      const fixtures = await getFixturesForDates(dates, baseParams);
      return NextResponse.json({ fixtures, count: fixtures.length });
    } catch (err) {
      if (err instanceof PlanRestrictionError) {
        // Use the exact range the API allows
        const clamped = buildDateList(err.from, err.to, MAX_DATE_RANGE_DAYS);
        const fixtures = await getFixturesForDates(clamped, baseParams);
        return NextResponse.json({ fixtures, count: fixtures.length });
      }
      throw err;
    }
  } catch (error) {
    console.error('GET /api/fixtures error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fixtures' },
      { status: 500 }
    );
  }
}
