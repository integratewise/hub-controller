'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatProps {
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Create a task 'Review Q4 report' and assign it to John, due Friday",
  "Show all tasks due this week",
  "What projects are behind schedule?",
  "Create a project 'Mobile App v2' with high priority",
  "Mark the Hub Controller task as completed",
  "Show team workload and assignments",
];

export function AIChat({ className = '' }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault();
    const messageText = promptOverride || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create placeholder for assistant response
    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || 'https://hub-controller-api.connect-a1b.workers.dev/api'}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            history: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullContent }
                      : m
                  ));
                }
                if (parsed.error) {
                  fullContent = parsed.error;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullContent, isStreaming: false }
                      : m
                  ));
                }
              } catch {
                // Non-JSON chunk, append directly
                fullContent += data;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullContent }
                    : m
                ));
              }
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, isStreaming: false }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? {
              ...m,
              content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
              isStreaming: false,
            }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-2">
              Hub Controller AI
            </h2>
            <p className="text-neutral-400 mb-8 max-w-md">
              I can help you manage your business operations. Ask me about projects,
              metrics, customers, or give me commands to execute.
            </p>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(undefined, prompt)}
                  className="text-left px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-sm text-neutral-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-800 text-neutral-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content || (message.isStreaming && (
                      <span className="flex items-center gap-2 text-neutral-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                      </span>
                    ))}
                  </div>
                  {message.isStreaming && message.content && (
                    <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1" />
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-800 p-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="p-3 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business..."
                rows={1}
                className="w-full resize-none rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-3 pr-12 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ minHeight: '48px', maxHeight: '200px' }}
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
