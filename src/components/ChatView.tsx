import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Compass } from 'lucide-react';
import { Language, ChatMessage } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChatViewProps {
  language: Language;
  onBack: () => void;
}

export default function ChatView({ language, onBack }: ChatViewProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: language === 'ar' 
        ? "مرحباً! أنا دليلك السياحي الذكي إلى السويد. كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك في التخطيط لرحلات، العثور على مطاعم حلال، ترشيح فنادق، والمزيد!" 
        : language === 'sv'
        ? "Hej! Jag är din smarta reseguide till Sverige. Vad kan jag hjälpa dig med idag? Jag kan tipsa om sevärdheter, restauranger, hotell och mycket mer!"
        : "Hej! I am your smart travel guide to Sweden. How can I help you today? I can plan your trips, find attractions, recommend hotels, show halal restaurants, and more!",
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    language === 'ar' ? "ماذا يجب أن أزور في ستوكهولم؟" : "What should I visit in Stockholm?",
    language === 'ar' ? "أين يمكنني العثور على طعام حلال؟" : "Where can I find halal food?",
    language === 'ar' ? "خطط لرحلة عسل عائلية" : "Recommend hotels under 1500 SEK",
    language === 'ar' ? "كيف أستخدم وسائل النقل العام؟" : "How do I use public transport?",
    language === 'ar' ? "قارن بين ستوكهولم وغوتنبرغ" : "Compare Stockholm and Gothenburg",
    language === 'ar' ? "ماذا يجب أن أحزم للشتاء؟" : "What should I pack for winter?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          language: language
        })
      });
      
      const data = await response.json();
      if (response.ok && data.text) {
        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: data.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: language === 'ar' 
          ? "عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مجدداً." 
          : "Sorry, I encountered an issue connecting to the AI. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header with Scandi Dark Gradient */}
      <div className="bg-gradient-to-r from-scandi-blue to-[#003F6B] p-4 text-white flex items-center justify-between border-b border-slate-800/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-scandi-yellow rounded-lg text-scandi-dark">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm">{t.chat}</h3>
            <span className="text-[10px] text-slate-200/90 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Travel Concierge Active
            </span>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
          id="chat-back-btn"
        >
          {t.backToHome}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-scandi-light/50">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isAssistant ? '' : isRtl ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-full shadow-xs text-white ${isAssistant ? 'bg-scandi-blue' : 'bg-slate-700'}`}>
                {isAssistant ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>
              
              <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                isAssistant 
                  ? 'bg-slate-100 border border-slate-200/60 text-slate-800 rounded-tl-none' 
                  : 'bg-scandi-blue text-white rounded-tr-none'
              }`}>
                {/* Format simple bullets or newline blocks into paragraphs */}
                {msg.text.split('\n').map((para, i) => {
                  if (para.trim().startsWith('*') || para.trim().startsWith('-')) {
                    return <li key={i} className="list-disc ml-4 mr-4 py-0.5">{para.replace(/^[\*\-]\s*/, '')}</li>;
                  }
                  return <p key={i} className={para.trim() === '' ? 'h-2' : 'mb-1.5'}>{para}</p>;
                })}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[80%]">
            <div className="p-2 rounded-full bg-scandi-blue text-white shadow-xs">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 bg-slate-100 border border-slate-200/60 rounded-2xl text-sm text-slate-500 flex items-center gap-2 rounded-tl-none shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-scandi-blue" />
              <span className="font-medium">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions suggestion pills */}
      <div className="p-3 bg-white border-t border-slate-200 overflow-x-auto whitespace-nowrap flex gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-full border border-slate-200 font-bold transition-all cursor-pointer"
            id={`quick-q-${idx}`}
          >
            <Compass className="w-3 h-3 text-scandi-blue" />
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input 
          type="text"
          placeholder={t.chatPlaceholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          className="flex-1 py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-scandi-blue"
          disabled={isLoading}
          id="chat-text-input"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="p-3 bg-scandi-blue text-white hover:bg-scandi-blue/90 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          disabled={isLoading}
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
