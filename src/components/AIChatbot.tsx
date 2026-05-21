/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AIChatbotProps {
  currentRole: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  isFallback?: boolean;
}

export default function AIChatbot({ currentRole }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Hello! I am your Global Phix.IT AI Smart Assistant. 📱 How can I help you digitize your service business workflows today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);
    setIsWarning(false);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-10) // Send recent context
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: data.response,
        isFallback: !!data.warning
      }]);
      
      if (data.warning) {
        setIsWarning(true);
      }
    } catch (error) {
      console.error('Error communicating with AI Chat server:', error);
      // Soft interactive fallback so users are never stuck
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I am having trouble reaching the main server. Let me remind you that Global Phix.IT works with MTN MoMo and Telecel Cash! You can create repairs, update them, and pay via mobile money automatically! Let me know if you would like me to draft a quick ticket for you.",
        isFallback: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "How does MoMo payment work?",
    "What are the typical screen repair prices?",
    "What are the different repair workflow stages?",
    "How do I sign up as a Technician?"
  ];

  const triggerQuickQuestion = (qn: string) => {
    setInputValue(qn);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="globalphix-ai-chat-root">
      {/* Bot Floating Launcher Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-primary-300 group"
          id="ai-bot-toggle-btn"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent-500 text-[9px] text-white items-center justify-center font-bold">AI</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="flex h-[520px] w-[360px] flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl animate-fade-in sm:w-[380px]"
          id="ai-chat-window"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-4 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                <Bot className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-display">
                  Global Phix.IT AI
                  <Sparkles className="h-3 w-3 text-amber-200 fill-amber-200 animate-pulse" />
                </h3>
                <p className="text-[11px] text-primary-200">Active • Ghana, Lagos & Nairobi Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  {msg.isFallback && ' (Server Local Mode)'}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary-500" />
                <span>AI analyzing query...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length < 4 && (
            <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-100 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin scrollbar-thumb-rounded">
              {quickQuestions.map((qn, idx) => (
                <button
                  key={idx}
                  onClick={() => triggerQuickQuestion(qn)}
                  className="inline-block text-[11px] bg-white text-slate-700 font-medium px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  {qn}
                </button>
              ))}
            </div>
          )}

          {/* Warning banner if fallback is loaded */}
          {isWarning && (
            <div className="bg-amber-50 text-amber-800 text-[10px] px-3 py-1 flex items-center gap-1.5 border-t border-amber-100">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>Running in safe network mode because main API is validating credentials.</span>
            </div>
          )}

          {/* Chat Form Input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center rounded-b-2xl"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about repair pricing, MoMo, timelines..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary-500 focus:bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all select-none disabled:opacity-50 disabled:hover:bg-primary-600 disabled:scale-100 active:scale-95 shadow-md shadow-primary-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
