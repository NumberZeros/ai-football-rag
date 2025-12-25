import { ChatOpenAI } from '@langchain/openai';
import { ChatOpenAICompat } from './chat-openai-compat';

export function getChatModel(options?: {
  maxTokens?: number;
  maxCompletionTokens?: number;
  modelName?: string;
}): ChatOpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const modelName = options?.modelName || process.env.OPENAI_MODEL || 'gpt-5-nano';

  // GPT-5 models reject `max_tokens` and require `max_completion_tokens`.
  // Keep backward compatibility: if callers pass `maxTokens`, treat it as
  // `maxCompletionTokens` for GPT-5.
  const isGpt5Family = /^gpt-5/i.test(modelName);
  const requestedMaxCompletionTokens =
    options?.maxCompletionTokens ?? options?.maxTokens;

  const ModelClass = isGpt5Family ? ChatOpenAICompat : ChatOpenAI;

  return new ModelClass({
    openAIApiKey: apiKey,
    modelName,
    ...(isGpt5Family
      ? {
          modelKwargs: {
            max_completion_tokens: requestedMaxCompletionTokens,
          },
        }
      : {
          maxTokens: options?.maxTokens,
        }),
  });
}
