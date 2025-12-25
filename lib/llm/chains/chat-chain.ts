import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { getChatModel } from '../model-factory';
import { Session } from '../../session/types';
import { webSearchClient } from '../../search/web-search';

export interface ChatChainInput {
  session: Session;
  userQuestion: string;
  enableWebSearch?: boolean;
}

/**
 * Create chat prompt with session context
 */
function createChatPrompt(session: Session, webSearchContext = ''): ChatPromptTemplate {
  // Build context from session
  const fixtureContext = session.collectedData.fixture
    ? `Match: ${session.collectedData.fixture.teams.home.name} vs ${session.collectedData.fixture.teams.away.name}
League: ${session.collectedData.fixture.league.name}
Date: ${new Date(session.collectedData.fixture.fixture.date).toLocaleString()}
Venue: ${session.collectedData.fixture.fixture.venue.name || 'TBD'}`
    : 'No fixture data available';

  const reportSummary = session.finalReport
    ? session.finalReport.substring(0, 2000) // First 2000 chars
    : 'Report not yet generated';

  const dataSummary = `
Available Data:
- Statistics: ${session.collectedData.statistics ? 'Available' : 'Not available'}
- Injuries: ${session.collectedData.injuries ? `${session.collectedData.injuries.length} records` : 'Not available'}
- Lineups: ${session.collectedData.lineups ? 'Available' : 'Not available'}
- H2H Matches: ${session.collectedData.h2h ? `${session.collectedData.h2h.length} matches` : 'Not available'}
- Standings: ${session.collectedData.standings ? 'Available' : 'Not available'}
`;

  // Last 10 chat messages
  const chatHistory = session.chatHistory
    .slice(-10)
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const systemMessage = `You are a professional football (soccer) analyst assistant. You have access to a comprehensive pre-match report and match data.

**Match Context:**
${fixtureContext}

${dataSummary}

**Report Summary:**
${reportSummary}${webSearchContext}

**Instructions:**
- Answer questions based on the report and available data
- Be specific and cite data when possible
- If information is not available, say so clearly
- Maintain a professional yet friendly tone
- Keep responses concise (2-4 paragraphs max)
- Use bullet points for lists
- Write in English

**Recent Chat History:**
${chatHistory || 'No previous messages'}

Now answer the user's question based on the context above.`;

  return ChatPromptTemplate.fromMessages([
    ['system', systemMessage],
    ['human', '{userQuestion}'],
  ]);
}

/**
 * Create chat chain
 */
export function createChatChain(session: Session, webSearchContext = '') {
  const model = getChatModel({ maxCompletionTokens: 900 });
  const prompt = createChatPrompt(session, webSearchContext);
  const outputParser = new StringOutputParser();

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

/**
 * Execute chat interaction with optional web search
 */
export async function chatWithContext(input: ChatChainInput): Promise<string> {
  let webSearchContext = '';

  // Optionally augment with web search if enabled and query seems to need fresh data
  if (input.enableWebSearch && input.session.collectedData.fixture) {
    const question = input.userQuestion.toLowerCase();
    const needsWebSearch =
      question.includes('latest') ||
      question.includes('recent') ||
      question.includes('news') ||
      question.includes('current') ||
      question.includes('now') ||
      question.includes('today');

    if (needsWebSearch) {
      console.log('🔍 Augmenting with web search...');
      const fixture = input.session.collectedData.fixture;
      const searchResult = await webSearchClient.searchMatchContext(
        fixture.teams.home.name,
        fixture.teams.away.name,
        2
      );

      if (searchResult.success && searchResult.results && searchResult.results.length > 0) {
        webSearchContext = `\n\n**Recent Web Context:**\n${searchResult.results
          .map((r) => `- ${r.title}: ${r.content.substring(0, 200)}...`)
          .join('\n')}\n`;
      }
    }
  }

  const chain = createChatChain(input.session, webSearchContext);
  
  try {
    const response = await chain.invoke({
      userQuestion: input.userQuestion,
    });
    
    return response;
  } catch (error) {
    console.error('Chat chain error:', error);
    throw new Error(`Failed to process chat: ${error}`);
  }
}
