/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '../utils/navigation';
import { 
  ArrowLeft, MessageCircle, Phone, Send, User, 
  Facebook, Twitter, Youtube, Mail, MapPin, 
  ChevronRight, ExternalLink, RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence } from '../lib/safe-motion';
import BottomNav from '../components/BottomNav';
import { useCompany } from '../context/CompanyContext';
import { MessengerMessage } from '../types';

export default function MessengerPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { companySettings } = useCompany();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('naimshop_logged_in_user');
    if (savedUser) {
      try {
        setLoggedInUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Initial fetch of support messages
    fetchMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = () => {
    return fetch('/api/messenger/messages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(prev => {
            // Keep local outgoing messages that are currently sending or failed
            const localSendingOrFailed = prev.filter(m => m.status === 'sending' || m.status === 'failed');
            // Remove any items from remote data that already exist in our local tracking list to avoid duplicates
            const cleanData = data.filter(d => !localSendingOrFailed.some(l => l.id === d.id));
            return [...cleanData, ...localSendingOrFailed].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
        }
      })
      .catch(err => console.error(err));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const tempId = 'temp_' + Date.now();
    const userMsg: MessengerMessage = {
      id: tempId,
      customerId: loggedInUser?.id || 'guest_' + Date.now(),
      customerName: loggedInUser?.name || 'Guest Customer',
      customerEmail: loggedInUser?.email || 'guest@example.com',
      message: text,
      replyBy: 'customer',
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sending'
    };

    // Render locally and immediately
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      const { id, status, ...msgPayload } = userMsg;
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgPayload)
      });
      
      if (res.ok) {
        const saved = await res.json();
        // Replace temp message with successfully delivered server response
        setMessages(prev => prev.map(m => m.id === tempId ? { ...saved, status: 'delivered' } : m));
        // Pull latest to immediately get the synchronous AI response
        await fetchMessages();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error(err);
      // Mark as failed and show retry
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  const handleRetryMessage = async (failedMsg: MessengerMessage) => {
    // Set status back to sending
    setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'sending' } : m));
    
    try {
      const { id, status, ...msgPayload } = failedMsg;
      const res = await fetch('/api/messenger/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgPayload)
      });
      
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...saved, status: 'delivered' } : m));
        // Pull latest AI response
        await fetchMessages();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'failed' } : m));
    }
  };

  const handleSyncData = async () => {
    setIsLoading(true);
    try {
      await fetchMessages();
      triggerToast("এআই সর্বশেষ তথ্যের সাথে সিঙ্ক করা হয়েছে! (AI Sync Complete)");
    } catch (e) {
      console.error(e);
      triggerToast("সিঙ্ক ব্যর্থ হয়েছে!");
    } finally {
      setIsLoading(false);
    }
  };

  const logClick = (type: 'whatsapp' | 'messenger' | 'email' | 'call') => {
    fetch('/api/messenger/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, customerId: loggedInUser?.id })
    }).catch(console.error);
  };

  return (
    <div className="bg-[#f8fafc] h-screen flex flex-col overflow-hidden">
      {/* Premium Header - Green Status Bar */}
      <div className="bg-[#059669] px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm border-b border-[#047857]">
        <button 
          onClick={goBack}
          className="w-8.5 h-8.5 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-90 backdrop-blur-sm border border-white/10"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div>
          <h1 className="text-base font-black text-white leading-tight">Messenger Support</h1>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-50 uppercase tracking-wider">Active Now</span>
          </div>
        </div>
        <button onClick={handleSyncData} className="ml-auto w-8.5 h-8.5 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white border border-white/10 cursor-pointer">
           <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 bg-slate-900/95 text-white py-2.5 px-4 rounded-xl text-center text-[10px] font-bold shadow-lg z-50 flex items-center justify-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white relative">
        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 no-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <MessageCircle size={24} />
              </div>
              <div>
                <b className="text-sm text-slate-900 block">How can we help?</b>
                <p className="text-[10px] text-slate-400 font-medium">Ask about your order status or stock.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.replyBy === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] font-semibold shadow-xs ${
                  msg.replyBy === 'customer' 
                    ? 'bg-[#059669] text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${
                      msg.replyBy === 'customer' ? 'text-white/70' : 'text-slate-400'
                    }`}>
                       {msg.replyBy === 'ai' ? '✨ NaimShop AI' : (msg.replyBy === 'human' ? '👔 Moderator' : 'You')} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* Message delivery/failed/sending status */}
                    {msg.replyBy === 'customer' && (
                      <span className="text-[8px] font-black">
                        {msg.status === 'sending' && (
                          <span className="text-white/60 italic animate-pulse">Sending...</span>
                        )}
                        {msg.status === 'failed' && (
                          <span className="text-rose-200">
                            Failed • <button type="button" onClick={() => handleRetryMessage(msg)} className="underline cursor-pointer bg-transparent border-none text-rose-300 font-extrabold p-0 outline-none">Retry</button>
                          </span>
                        )}
                        {(msg.status === 'delivered' || !msg.status) && (
                          <span className="text-emerald-100 flex items-center gap-0.5">
                            <Check size={10} strokeWidth={3} />
                            <span>Sent</span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 h-10 bg-slate-50 border border-slate-150 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-[#059669] focus:bg-white text-slate-800 transition-all shadow-inner pointer-events-auto"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-[#059669] hover:bg-[#047857] text-white border-none rounded-xl flex items-center justify-center shadow-md shadow-emerald-100 active:scale-95 transition-all cursor-pointer shrink-0 pointer-events-auto"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Contact Options - Placed at the Bottom */}
      <div className="bg-slate-50 border-t border-slate-150 py-3 px-4 shrink-0 flex flex-col items-center gap-2">
        <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Options</h2>
        <div className="flex items-center justify-center gap-7">
          
          {/* Call Support */}
          <a 
            href={`tel:${companySettings.mobile || '01671060679'}`} 
            onClick={() => logClick('call')}
            className="w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 bg-white rounded-full shadow-xs border border-slate-100"
            title="Call"
          >
            <Phone className="w-5 h-5 text-indigo-500" strokeWidth={2.5} />
          </a>

          {/* WhatsApp Support */}
          <a 
            href={companySettings.socialLinks?.whatsapp || `https://wa.me/${companySettings.whatsapp || '01671060679'}`} 
            target="_blank"
            rel="noreferrer"
            onClick={() => logClick('whatsapp')}
            className="w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 bg-white rounded-full shadow-xs border border-slate-100"
            title="WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 00-5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>

          {/* Messenger Support */}
          <a 
            href={companySettings.socialLinks?.messenger || 'https://m.me/naimshop'} 
            target="_blank"
            rel="noreferrer"
            onClick={() => logClick('messenger')}
            className="w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 bg-white rounded-full shadow-xs border border-slate-100"
            title="Messenger"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0084FF]"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/></svg>
          </a>

          {/* Gmail 1 */}
          <a 
            href={`mailto:${companySettings.email || 'help.iyabd@gmail.com'}`}
            className="w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 bg-white rounded-full shadow-xs border border-slate-100"
            title="Gmail 1"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail 1" className="w-5 h-5 object-contain" />
          </a>

          {/* Gmail 2 */}
          <a 
            href={`mailto:${companySettings.email2 || 'admin.iyabd@gmail.com'}`}
            className="w-9 h-9 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 bg-white rounded-full shadow-xs border border-slate-100"
            title="Gmail 2"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail 2" className="w-5 h-5 object-contain" />
          </a>

        </div>
      </div>

      <div className="shrink-0 h-16 bg-white border-t border-slate-100">
        <BottomNav />
      </div>
    </div>
  );
}
