import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { generateAIResponse } from '../services/aiService';

export default function AIChatbot({ transactions, currency = 'VND' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Chào cậu! Mình là trợ lý AI chuyên gia tài chính. Cậu muốn phân tích dữ liệu hôm nay, xin lời khuyên tiết kiệm, hay xem số dư hiện tại?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
       const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
       const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
       const currentBalance = totalIncome - totalExpense;

       const context = {
           totalIncome,
           totalExpense,
           currentBalance,
           currency
       };

       const aiReply = await generateAIResponse(userMessage, null, context, messages.slice(-10));
       
       setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    } catch (err) {
       console.error(err);
       setMessages(prev => [...prev, { role: 'ai', text: '❌ Lỗi hệ thống: Hiện tại không thể kết nối tới Google Gemini. Vui lòng kiểm tra môi trường hoặc mạng.' }]);
    } finally {
       setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 90 }}
          >
            <button 
              onClick={() => setIsOpen(true)}
              style={{
                width: '68px', height: '68px', borderRadius: '34px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white',
                boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Nova" alt="AI Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', padding: '2px' }} />
              <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--danger)', border: '3px solid var(--surface-opaque)' }}></div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="friendly-card"
            style={{ 
              position: 'fixed', bottom: '32px', right: '32px', width: '380px', height: '620px', 
              display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden',
              boxShadow: 'var(--shadow-hover)'
            }}
          >
            {/* Header AI Chat */}
            <div style={{ padding: '20px 24px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                 <div className="chat-bot-avatar" style={{width: 48, height: 48, background: '#fff', overflow: 'hidden', padding: '2px'}}>
                   <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Nova" alt="AI Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                 </div>
                 <div>
                   <h3 style={{ fontSize: '17px', color: 'white', margin: 0 }}>Smart Advisor</h3>
                   <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80' }}></span> Online
                   </span>
                 </div>
              </div>
              <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ color: 'white', borderColor: 'transparent', width: 40, height: 40 }}>
                <X size={24} />
              </button>
            </div>

            {/* Khung Chat Chính */}
            <div className="chat-container" ref={scrollRef}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}
                >
                  {msg.role === 'ai' && (
                    <div className="chat-bot-avatar" style={{width: 36, height: 36, background: '#fff', overflow: 'hidden', padding: '2px', border: '1px solid var(--border-light)'}}>
                       <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Nova" alt="AI Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    {msg.text.split('\n').map((line, i) => (
                       <span key={i}>
                          {line}
                          <br />
                       </span>
                    ))}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                   <div className="chat-bot-avatar" style={{width: 36, height: 36, background: '#fff', overflow: 'hidden', padding: '2px', border: '1px solid var(--border-light)'}}>
                       <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Nova" alt="AI Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                   </div>
                   <div className="chat-bubble-ai" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '16px' }}>
                     <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                     <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                     <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                   </div>
                </motion.div>
              )}
            </div>

            {/* Input Gửi Tin Nhắn */}
            <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--surface-opaque)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Hỏi AI thông minh..." 
                  className="input-friendly"
                  style={{ paddingRight: '56px', borderRadius: '30px' }}
                />
                <button type="submit" disabled={!input.trim()}
                  style={{ 
                    position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', 
                    background: input.trim() ? 'var(--primary)' : 'var(--border-light)', 
                    color: input.trim() ? 'white' : 'var(--text-muted)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.2s' 
                  }} 
                >
                  <Send size={18} style={{ marginLeft: '-2px' }} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
