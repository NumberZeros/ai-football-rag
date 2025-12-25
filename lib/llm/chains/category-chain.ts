import { RunnableSequence } from '@langchain/core/runnables';
import { getChatModel } from '../model-factory';
import { categoryPromptTemplate } from '../prompts';
import { CategoryReportSchema, CategoryReportOutput } from '../schemas';
import { PartialReport } from '../../session/types';
import { truncateText } from '../utils/text';

export interface CategoryChainInput {
  homeTeam: string;
  awayTeam: string;
  categoryName: string;
  categoryEmoji: string;
  signalReports: string; // Formatted partial reports
  [key: string]: any;
}

/**
 * Create a category merge chain
 */
export function createCategoryChain() {
  const model = getChatModel();
  const structuredModel = model.withStructuredOutput(CategoryReportSchema);

  return RunnableSequence.from([
    categoryPromptTemplate,
    structuredModel,
  ]);
}

/**
 * Execute category merge
 */
export async function mergeCategory(input: CategoryChainInput): Promise<CategoryReportOutput> {
  const chain = createCategoryChain();
  
  try {
    const result = await chain.invoke(input);
    return result as CategoryReportOutput;
  } catch (error) {
    console.error('Category chain error:', error);
    throw new Error(`Failed to merge category "${input.categoryName}": ${error}`);
  }
}

/**
 * Helper to format partial reports for category merge
 */
export function formatPartialReportsForCategory(partialReports: PartialReport[]): string {
  return partialReports
    .map((report, index) => {
      const insights = report.insights.slice(0, 5);
      const narrative = truncateText(report.narrative, 900);
      return `
### Signal ${index + 1}: ${report.title} ${report.emoji}

**Insights:**
${insights.map((insight) => `- ${insight}`).join('\n')}

**Narrative:**
${narrative}

**Confidence:** ${(report.confidence * 100).toFixed(0)}%

---
`;
    })
    .join('\n');
}
