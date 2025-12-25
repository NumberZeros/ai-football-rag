'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/animations';

interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  currentTask?: string;
  details?: {
    current?: number;
    total?: number;
  };
}

export default function ReportClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Start SSE connection
    const eventSource = new EventSource(`/api/generate?sessionId=${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('start', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      console.log('Generation started:', data);
    });

    eventSource.addEventListener('progress', (e) => {
      const data: ProgressUpdate = JSON.parse((e as MessageEvent).data);
      setProgress(data);
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setReport(data.report);
      setGenerating(false);
    });

    eventSource.addEventListener('server_error', (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setError(data.message);
      setGenerating(false);
    });

    eventSource.addEventListener('error', (e) => {
      const maybeData = (e as MessageEvent).data;
      if (typeof maybeData !== 'string' || maybeData.length === 0) return;
      try {
        const data = JSON.parse(maybeData);
        if (data?.message) {
          setError(data.message);
          setGenerating(false);
        }
      } catch {
        // ignore
      }
    });

    eventSource.addEventListener('done', () => {
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error('SSE error:', {
        err,
        readyState: eventSource.readyState,
        url: `/api/generate?sessionId=${sessionId}`,
      });

      setError((prev) => prev || 'Connection lost. Please try again.');
      setGenerating(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message that we'll update
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            assistantMessage += chunk;

            // Update the last message with accumulated content
            setChatMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: assistantMessage,
              };
              return newMessages;
            });
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Header */}
      <FadeIn>
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 transition-colors"
          >
            ← Back to fixtures
          </button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Match report
          </h1>
        </div>
      </FadeIn>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 p-6"
          >
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">Generation error</h3>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors"
            >
              Go home
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <AnimatePresence>
        {generating && !error && progress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <motion.div
                  key={progress.message}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {progress.message}
                </motion.div>
                {progress.currentTask && (
                  <motion.div
                    key={progress.currentTask}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-1 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    {progress.currentTask}
                  </motion.div>
                )}
              </div>
              <motion.div
                key={progress.progress}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {progress.progress}%
              </motion.div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-zinc-900 dark:bg-zinc-50"
              />
            </div>

            {progress.details?.current && progress.details?.total && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-zinc-600 dark:text-zinc-400"
              >
                Processing {progress.details.current} of {progress.details.total}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Display */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8"
          >
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {report && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
          >
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Follow-up questions</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Ask about tactics, form, injuries, or key matchups.
              </p>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <FadeIn delay={0.3}>
                  <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">
                    <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">Ask anything about the match</p>
                    <p className="mt-2 text-sm">
                      Example: "What are the key tactical battles?" or "Any important injuries?"
                    </p>
                  </div>
                </FadeIn>
              )}

              <AnimatePresence mode="popLayout">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {chatLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4">
                    <div className="flex gap-2">
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-2 h-2 bg-zinc-400 rounded-full"
                      />
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1, ease: 'easeInOut' }}
                        className="w-2 h-2 bg-zinc-400 rounded-full"
                      />
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                        className="w-2 h-2 bg-zinc-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="border-t border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a question..."
                  disabled={chatLoading}
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
