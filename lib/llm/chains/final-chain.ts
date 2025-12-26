import { RunnableSequence } from '@langchain/core/runnables';
import { getChatModel } from '../model-factory';
import { finalPromptTemplate } from '../prompts';
import { FinalReportSchema, FinalReportOutput } from '../schemas';
import { CategoryReport } from '../../session/types';
import { truncateText } from '../utils/text';

export interface FinalChainInput {
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  categoryReports: string; // Formatted category reports
  [key: string]: any;
}

/**
 * Create a final synthesis chain
 */
export function createFinalChain() {
  const model = getChatModel({ maxCompletionTokens: 3000 });
  const structuredModel = model.withStructuredOutput(FinalReportSchema);

  return RunnableSequence.from([
    finalPromptTemplate,
    structuredModel,
  ]);
}

/**
 * Execute final report synthesis
 */
export async function synthesizeFinalReport(input: FinalChainInput): Promise<FinalReportOutput> {
  const chain = createFinalChain();
  
  try {
    const result = await chain.invoke(input);
    return result as FinalReportOutput;
  } catch (error) {
    console.error('Final chain error:', error);
    throw new Error(`Failed to synthesize final report: ${error}`);
  }
}

/**
 * Helper to format category reports for final synthesis
 */
export function formatCategoryReportsForFinal(categoryReports: Record<string, CategoryReport>): string {
  const formatted = Object.values(categoryReports)
    .filter(report => report && report.sections && report.talkingPoints) // Filter out undefined/incomplete reports
    .map((report) => {
      const sectionsText = report.sections
        .map((section) => {
          const sectionContent = truncateText(section.content, 900);
          return `
#### ${section.emoji} ${section.title}

${sectionContent}
`;
        })
        .join('\n');

      const talkingPointsText = report.talkingPoints
        .map((point) => `- ${point}`)
        .join('\n');

      return `
## ${report.title}

${sectionsText}

**Key Talking Points:**
${talkingPointsText}

---
`;
    })
    .join('\n');

  // Hard cap to avoid prompt overflow on long reports.
  return truncateText(formatted, 24000);
}

/**
 * Format final report output as readable markdown
 */
export function formatFinalReportAsMarkdown(report: FinalReportOutput): string {
  const sections = (report.sections || [])
    .map((section) => {
      return `
## ${section.emoji} ${section.title}

${section.content}

---
`;
    })
    .join('\n');

  const talkingPoints = (report.quickTalkingPoints || [])
    .map((point, index) => `${index + 1}. ${point}`)
    .join('\n');

  return `
# ${report.title}

### ${report.subtitle}

${sections}

## 🎙️ Quick Talking Points

${talkingPoints}

---

*Report generated on ${new Date().toLocaleString()}*
`;
}
