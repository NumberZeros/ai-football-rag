import { z } from 'zod';

/**
 * Schema for signal-level report output
 */
export const SignalReportSchema = z.object({
  insights: z.array(z.string()).min(1).describe('Key insights extracted from the data (3-5 bullet points)'),
  narrative: z.string().min(10).describe('A cohesive narrative paragraph connecting the insights (100-150 words)'),
  emoji: z.string().min(1).describe('A single emoji that represents this signal'),
  confidence: z.number().min(0).max(1).describe('Confidence level in the analysis (0-1)'),
});

export type SignalReportOutput = z.infer<typeof SignalReportSchema>;

/**
 * Schema for category-level report output
 */
export const CategoryReportSchema = z.object({
  title: z.string().describe('Category title for the report'),
  sections: z.array(
    z.object({
      title: z.string().describe('Section title'),
      content: z.string().describe('Section content with bullet points and formatting'),
      emoji: z.string().describe('Section emoji'),
    })
  ).describe('Sections within this category'),
  talkingPoints: z.array(z.string()).describe('Key talking points for commentators (3-5 items)'),
});

export type CategoryReportOutput = z.infer<typeof CategoryReportSchema>;

/**
 * Schema for final report output
 */
export const FinalReportSchema = z.object({
  title: z.string().describe('Main title of the match report'),
  subtitle: z.string().describe('Subtitle with match context'),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      emoji: z.string(),
    })
  ).describe('All report sections organized and formatted'),
  quickTalkingPoints: z.array(z.string()).describe('Top 5-10 quick talking points for the match'),
});

export type FinalReportOutput = z.infer<typeof FinalReportSchema>;
