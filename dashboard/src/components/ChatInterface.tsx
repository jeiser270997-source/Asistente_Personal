'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: newMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: newMsg }].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error en la respuesta de la API');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 transition-transform duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'}`}
        aria-label="Abrir Chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right z-50 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/50 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">LifeOS Assistant</h3>
              <p className="text-[11px] text-emerald-400 font-mono">deepseek-v4-flash</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900/50 scrollbar-thin scrollbar-thumb-neutral-800">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
              <Bot className="w-12 h-12 text-neutral-500" />
              <p className="text-sm text-neutral-400 max-w-[200px]">
                Pregúntame sobre tus finanzas, empleos, procesos de tránsito o el estado del sistema.
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start max-w-[85%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-neutral-800'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-neutral-800 text-neutral-200 border border-neutral-700/50 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start max-w-[85%] space-x-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-neutral-800">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-neutral-800 border border-neutral-700/50 rounded-tl-sm flex items-center space-x-1.5">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-xs text-neutral-400">Procesando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta algo..."
              disabled={isLoading}
              className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-neutral-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-1.5 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
