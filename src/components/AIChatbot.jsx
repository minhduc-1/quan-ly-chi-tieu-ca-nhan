import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function AIChatbot({ transactions, currency = 'VND' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Chào bạn! Tôi là trợ lý ảo AI SmartExpense. Bạn cần tôi phân tích dữ liệu hay tư vấn tài chính gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
       const lowerInput = userMessage.toLowerCase();
       let aiReply = 'Xin lỗi, tôi chưa hiểu ý bạn, bạn có thể nói rõ hơn không?';

       const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
       const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

       if (lowerInput.includes('tổng chi') || lowerInput.includes('tiêu bao nhiêu')) {
           aiReply = `Tháng này bạn đã tiêu tổng cộng ${formatCurrency(totalExpense, currency)}. Hãy chú ý ngân sách nhé!`;
       } else if (lowerInput.includes('tổng thu') || lowerInput.includes('kiếm được')) {
           aiReply = `Bạn đã thu được ${formatCurrency(totalIncome, currency)}. Một con số tuyệt vời!`;
       } else if (lowerInput.includes('lời khuyên') || lowerInput.includes('tư vấn')) {
           if (totalExpense > totalIncome * 0.8) {
               aiReply = 'Cảnh báo Đỏ! Bạn đã tiêu quá 80% thu nhập. Nên ngừng tiệc tùng và chuyển sang ăn mì tôm 🍜.';
           } else {
               aiReply = 'Tình hình tài chính của bạn đang rất ổn định. Nhớ trích 20% tháng này vào Quỹ Tiết Kiệm nhé! 💰';
           }
       } else if (lowerInput.includes('tiết kiệm') || lowerInput.includes('mục tiêu')) {
           aiReply = 'Để tiết kiệm hiệu quả, nguyên tắc vàng là: 50% Nhu cầu thiết yếu, 30% Hưởng thụ, 20% Tiết kiệm/Đầu tư.';
       }

       setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
       setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Nút Gọi AI Điểm Nhấn */}
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
                width: '64px', height: '64px', borderRadius: '32px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Bot size={32} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--bg-app)' }}></div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cửa Sổ Chatbot Glassmorphism */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="friendly-card"
            style={{ position: 'fixed', bottom: '32px', right: '32px', width: '380px', height: '600px', display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden' }}
          >
            {/* Header AI Chat */}
            <div style={{ padding: '20px 24px', background: 'var(--primary-bg)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '14px', color: 'white' }}>
                   <Sparkles size={20} />
                 </div>
                 <div>
                   <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Smart Assistant AI</h3>
                   <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%' }}></span> Online
                   </span>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="btn-icon" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {/* Khung Chat Chính */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{ 
                    maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.5,
                    background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'var(--surface-opaque)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--surface-opaque)', borderRadius: '16px', borderBottomLeftRadius: '4px', maxWidth: '80px', border: '1px solid var(--border-glass)' }}>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                   <span style={{ width: 6, height: 6, background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                </motion.div>
              )}
            </div>

            {/* Input Gửi Tin Nhắn */}
            <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)', backdropFilter: 'blur(20px)' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Hỏi AI bất cứ điều gì..." 
                  className="input-glass"
                  style={{ paddingRight: '48px', borderRadius: '24px' }} 
                />
                <button type="submit" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
