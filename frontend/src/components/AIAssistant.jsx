import React, { useState, useRef, useEffect } from 'react';
import { askAIAssistant } from '../api';
import { Send, HelpCircle, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

export default function AIAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your Ethara AI Workspace Assistant. Ask me anything about employee seats, project mappings, floor capacities, or nearby desk clusters.\n\nFor example, try clicking one of the sample queries below!",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested Sample Queries
  const sampleQueries = [
    "Where is employee Amit seated?",
    "Where is my seat? My email is amit@ethara.ai",
    "Show all available seats on Floor 3.",
    "Who is sitting near Amit Patel?",
    "How many seats are occupied for Project Talos?",
    "Allocate a seat for a new employee joining today."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await askAIAssistant(text);
      const botMsg = { sender: 'bot', text: res.data.answer, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = { 
        sender: 'bot', 
        text: "I encountered an error connecting to the backend. Please verify that the server is active on port 5000.", 
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-h-[calc(100vh-140px)]">
      {/* Sample Queries Sidebar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1 h-fit">
        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-indigo-400" />
          Suggested Queries
        </h3>
        <p className="text-xs text-slate-500">Click any prompt to ask the AI assistant immediately.</p>
        
        <div className="space-y-2">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="w-full text-left p-3 glass-card hover:border-indigo-500/40 rounded-xl text-xs text-slate-300 hover:text-white transition duration-150 disabled:opacity-50"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Main Dialogue Box */}
      <div className="lg:col-span-3 glass-panel rounded-2xl border border-slate-800 flex flex-col h-[520px] relative overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Ethara AI Assistant</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Local Engine Online
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">
            v1.0.0
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-xl h-9 w-9 flex items-center justify-center shrink-0 ${
                  isBot 
                    ? msg.isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}>
                  {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-3.5 rounded-2xl border text-sm whitespace-pre-line leading-relaxed ${
                  isBot 
                    ? msg.isError 
                      ? 'bg-red-500/5 border-red-500/20 text-red-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-100' 
                    : 'bg-indigo-600/90 border-indigo-500/50 text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl h-9 w-9 flex items-center justify-center">
                <Bot className="h-4 w-4 animate-bounce" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex gap-2">
          <input 
            type="text" 
            placeholder="Ask where someone is seated or get project occupancy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
