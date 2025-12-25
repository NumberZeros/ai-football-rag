import { ChatOpenAI } from '@langchain/openai';

/**
 * LangChain's ChatOpenAI currently always includes `max_tokens` in the request params.
 * Some newer OpenAI models (e.g. GPT-5 family) reject `max_tokens` and require
 * `max_completion_tokens` instead.
 *
 * This subclass strips `max_tokens` from outbound params and forwards
 * `max_completion_tokens` via modelKwargs.
 */
export class ChatOpenAICompat extends ChatOpenAI {
  invocationParams(
    ...args: Parameters<ChatOpenAI['invocationParams']>
  ): ReturnType<ChatOpenAI['invocationParams']> {
    const params = super.invocationParams(...args);

    const model = String((params as any).model ?? this.modelName ?? '');
    const isGpt5Family = /^gpt-5/i.test(model);

    if (isGpt5Family) {
      // Remove entirely; some serializers may otherwise send null.
      delete (params as any).max_tokens;

      // Forward max_completion_tokens if provided.
      const maxCompletionTokens =
        // modelKwargs is the official escape hatch for unsupported params.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.modelKwargs as any)?.max_completion_tokens;

      if (typeof maxCompletionTokens === 'number') {
        (params as any).max_completion_tokens = maxCompletionTokens;
      }
    }

    return params;
  }
}
