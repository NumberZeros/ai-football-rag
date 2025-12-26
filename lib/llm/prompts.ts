import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Signal-level analysis prompt
 */
export const signalPromptTemplate = PromptTemplate.fromTemplate(`
You are a professional football (soccer) analyst creating a pre-match report section.

**Context:**
Match: {homeTeam} vs {awayTeam}
League: {league}
Date: {date}

**Your Task:**
Analyze the following signal: "{signalName}"
Description: {signalDescription}

**Available Data:**
{collectedData}

**IMPORTANT: If predictions data is available**, it includes:
- Win probabilities from API-Football's AI (home/draw/away percentages)
- Expected goals predictions
- Form analysis and team comparisons
- Professional betting advice
USE THIS DATA to enhance your analysis with expert predictions!

**Instructions:**
1. Extract 3-5 key insights from the data
2. Write a cohesive narrative paragraph (100-150 words) connecting the insights
3. Choose an appropriate emoji that represents this analysis
4. Assess your confidence level (0-1) based on data quality and completeness

**Style Guidelines:**
- Professional yet engaging tone
- Use bullet points for insights
- Include specific statistics when available
- Focus on what matters for commentators and analysts
- Write in English

**CRITICAL OUTPUT REQUIREMENTS:**
You MUST return a complete JSON object with ALL FOUR fields. NO EXCEPTIONS.

REQUIRED FORMAT (copy this structure exactly):
{{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "narrative": "Your 100-150 word paragraph narrative connecting the insights. This field is MANDATORY and must be a complete paragraph, not empty.",
  "emoji": "⚽",
  "confidence": 0.85
}}

⚠️ VALIDATION RULES:
- "insights": Array with 3-5 strings (REQUIRED)
- "narrative": String with 100-150 words (REQUIRED, cannot be empty)
- "emoji": Single emoji character (REQUIRED)
- "confidence": Number between 0 and 1 (REQUIRED)

If data is limited, still provide ALL fields with best estimates.
Do NOT skip any field. Do NOT return partial JSON.
`);

/**
 * Category merge prompt
 */
export const categoryPromptTemplate = PromptTemplate.fromTemplate(`
You are a professional football analyst synthesizing multiple analysis signals into a cohesive category report.

**Match Context:**
{homeTeam} vs {awayTeam}
Category: {categoryName} {categoryEmoji}

**Signal Reports to Merge:**
{signalReports}

**Instructions:**
1. Merge the insights from all signals into organized sections
2. Remove redundancies and contradictions
3. Create a clear narrative flow
4. Generate 3-5 key talking points for commentators
5. Maintain specific data points and statistics
6. Use emojis, bullet points, and clear section headers

**Style Guidelines:**
- GPT-style formatting (bullets, headers, separators)
- Professional yet accessible language
- Focus on actionable insights for live commentary
- Highlight surprising or critical information
- Write in English

Create a comprehensive category report.
`);

/**
 * Final synthesis prompt
 */
export const finalPromptTemplate = PromptTemplate.fromTemplate(`
You are a senior football analyst creating the final comprehensive pre-match report.

**Match:**
{homeTeam} vs {awayTeam}
{league} - {date}

**Category Reports:**
{categoryReports}

**Instructions:**
1. Synthesize all category reports into a single, cohesive match report
2. Create a compelling title and subtitle
3. Organize sections with clear hierarchy and flow
4. Generate 5-10 quick talking points (the absolute must-knows for commentators)
5. Remove any redundancies across categories
6. Ensure smooth transitions between sections
7. Maintain all critical insights and data

**Format Requirements:**
- Use emojis for visual appeal
- Bullet points for easy scanning
- Section dividers (---)
- Professional GPT-style formatting
- Clear hierarchy: Title → Subtitle → Sections → Talking Points
- Write in English

**Target Audience:**
Live commentators, analysts, and streamers who need quick, actionable insights before the match.

Create the final comprehensive match report.
`);
