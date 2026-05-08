"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { aiApi } from "@/lib/api";
import { clsx } from "clsx";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

export default function CoachPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await aiApi.sessions();
      return res.data as ChatSession[];
    },
  });

  // 2. Fetch history for active session
  const { data: messages = [], isLoading: historyLoading } = useQuery({
    queryKey: ["chat-history", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [{ role: "assistant", content: "Hello! I'm your AuraFit AI Coach. Start a new chat to begin!" }] as Message[];
      const res = await aiApi.history(activeSessionId);
      return res.data as Message[];
    },
    enabled: true, // Always enabled, but logic inside handles null
  });

  // 3. Mutation for sending messages
  const chatMutation = useMutation({
    mutationFn: async ({ message, history, sessionId }: { message: string, history: Message[], sessionId?: number }) => {
      const res = await aiApi.chat(message, history, sessionId);
      return res.data;
    },
    onMutate: async (newChat) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["chat-history", activeSessionId] });
      const previousMessages = queryClient.getQueryData<Message[]>(["chat-history", activeSessionId]);
      
      const optimisticUserMsg: Message = { role: "user", content: newChat.message };
      queryClient.setQueryData(["chat-history", activeSessionId], (old: Message[] = []) => [...old, optimisticUserMsg]);
      
      return { previousMessages };
    },
    onSuccess: (data) => {
      if (!activeSessionId) {
        setActiveSessionId(data.session_id);
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      }
      queryClient.invalidateQueries({ queryKey: ["chat-history", data.session_id] });
    },
    onError: (err, newChat, context) => {
      queryClient.setQueryData(["chat-history", activeSessionId], context?.previousMessages);
    }
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate({
      message: input,
      history: messages.slice(-6),
      sessionId: activeSessionId || undefined
    });
    setInput("");
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  // Memoize session list to avoid unnecessary re-renders
  const renderedSessions = useMemo(() => {
    return sessions.map((s) => (
      <button
        key={s.id}
        onClick={() => setActiveSessionId(s.id)}
        className={clsx(
          "w-full text-left p-3 rounded-xl transition-all duration-200 border text-sm truncate",
          activeSessionId === s.id 
            ? "bg-green-600/10 border-green-500/30 text-green-400" 
            : "bg-transparent border-transparent text-gray-400 hover:bg-white/5"
        )}
      >
        {s.title}
      </button>
    ));
  }, [sessions, activeSessionId]);

  return (
    <AppShell>
      <div className="flex gap-8 h-[calc(100vh-140px)] w-full">
        {/* Sidebar */}
        <div className="w-64 flex flex-col gap-4 flex-shrink-0">
          <button 
            onClick={handleNewChat}
            className="w-full p-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all shadow-lg shadow-green-500/20"
          >
            + New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {sessionsLoading ? (
              <div className="text-gray-500 text-xs text-center mt-4">Loading chats...</div>
            ) : renderedSessions}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title : "AI Fitness Coach"}
            </h1>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar"
          >
            {historyLoading && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Fetching conversation...
              </div>
            ) : (
              messages.map((m, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user" 
                      ? "self-end bg-green-600 text-white rounded-br-none" 
                      : "self-start bg-white/5 text-gray-200 border border-white/5 rounded-bl-none"
                  )}
                >
                  {m.content}
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="self-start bg-white/5 text-gray-400 p-4 rounded-2xl border border-white/5 rounded-bl-none animate-pulse">
                Thinking...
              </div>
            )}
            {chatMutation.isError && (
              <div className="self-center bg-red-500/10 text-red-400 px-4 py-2 rounded-full text-xs border border-red-500/20">
                Failed to send. Please check your connection.
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white/[0.02] border-t border-white/5">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask about training, form, or macros..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500/50 transition-all placeholder:text-gray-600"
              />
              <button
                onClick={handleSend}
                disabled={chatMutation.isPending}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
