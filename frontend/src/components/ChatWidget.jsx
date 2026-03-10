import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, Calendar, Clipboard, ShieldCheck, Search, Activity, Lock } from 'lucide-react';
import chatApi from '../api/chatApi';

const QUICK_ACTIONS = [
  { label: '📅 Book Appointment', message: 'I want to book an appointment', icon: <Calendar className="w-3 h-3" /> },
  { label: '🧬 Test Results', message: 'Show my latest lab results', icon: <Activity className="w-3 h-3" /> },
  { label: '💊 Prescriptions', message: 'What are my active prescriptions?', icon: <Clipboard className="w-3 h-3" /> },
  { label: '🛡️ Privacy Help', message: 'How do I manage my data privacy?', icon: <ShieldCheck className="w-3 h-3" /> },
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your SecureCare Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = error.response 
        ? `Error ${error.response.status}: ${error.response.data?.error || error.message}`
        : `Network Error: Could not connect to the server at ${import.meta.env.VITE_API_URL || 'production URL'}. Please check if the backend is running.`;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (message) => {
    handleSend(message);
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: "New chat started. How can I assist you?" }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Chat Bubble Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 hover:rotate-6 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
          <MessageCircle className="w-8 h-8 relative z-10" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[420px] h-[650px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">SecureCare Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Live Concierge</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetChat} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  title="Reset Chat"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-blue-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">ARIA is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-100">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.message)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-left"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your question..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-32 text-slate-700"
                rows="1"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl transition-all ${
                  !input.trim() || isLoading 
                    ? 'bg-slate-300 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-1.5 opacity-50">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End-to-End Encrypted Health Query</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
