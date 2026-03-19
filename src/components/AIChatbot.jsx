import { useState, useRef, useEffect } from 'react';

export default function AIChatbot({ transactions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Chào bạn! Mình là Trợ lý AI. Mình thấu hiểu 100% dòng tiền của bạn. Bạn muốn tra cứu chi tiêu, phân tích danh mục nào hay hỏi về các khoản nợ?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      let replyText = 'Mình chưa rõ ý bạn lắm. Bạn có thể hỏi: "Tổng chi tiêu", "Chi nhiều nhất vào đâu" hoặc "Số dư của tôi" nhé!';
      const matchText = input.toLowerCase();

      // Đảo số liệu mượt mà
      const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

      if (matchText.includes('nhiều nhất')) {
         const catMap = {};
         transactions.filter(t => t.amount < 0).forEach(tx => catMap[tx.category] = (catMap[tx.category] || 0) + Math.abs(tx.amount));
         const topCat = Object.keys(catMap).length > 0 ? Object.keys(catMap).reduce((a, b) => catMap[a] > catMap[b] ? a : b) : 'Chưa có';
         replyText = `Dữ liệu hệ thống cảnh báo bạn đang tiêu tốn nhiều tiền nhất vào danh mục "${topCat}" với tổng số tiền là ${catMap[topCat]?.toLocaleString('vi-VN')} đ. Bạn nên tối ưu ngay hạng mục này!`;
      } else if (matchText.includes('tiết kiệm') || matchText.includes('lời khuyên')) {
         replyText = `Hiện tại bạn đã xài ${totalExpense.toLocaleString('vi-VN')} đ, thu về ${totalIncome.toLocaleString('vi-VN')} đ. Lời khuyên của mình: Hãy trích 20% thu nhập (${(totalIncome * 0.2).toLocaleString('vi-VN')} đ) nạp thẳng vào thẻ Mục Tiêu để làm vốn, chứ không nên để số dư đóng băng trong tay!`;
      } else if (matchText.includes('tổng chi') || matchText.includes('tiêu')) {
         replyText = `Tính đến thời điểm hiện tại, tổng hóa đơn chi tiêu bạn nạp vào hệ thống là ${totalExpense.toLocaleString('vi-VN')} đ.`;
      } else if (matchText.includes('số dư') || matchText.includes('dư')) {
         replyText = `Số dư khả dụng của bạn là ${(totalIncome - totalExpense).toLocaleString('vi-VN')} đ theo đối soát thuật toán.`;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText }]);
    }, 1200);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary"
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '64px', height: '64px', borderRadius: '50%',
          display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px var(--accent-blue)', zIndex: 9999, padding: 0,
          background: 'linear-gradient(135deg, #3498db, #2980b9)', border: 'none'
        }}
      >
        <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🤖</span>
      </button>

      {isOpen && (
        <div className="card animate-fade-in" style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '380px', height: '550px', display: 'flex', flexDirection: 'column',
          zIndex: 9999, boxShadow: '0 12px 48px rgba(0,0,0,0.5)', padding: 0, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-topbar)', color: 'white' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.1rem', fontWeight: '600' }}>
              <span style={{ fontSize: '1.4rem' }}>✨</span> AI Analytics Bot
            </h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.4rem', opacity: 0.8 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-main)', 
                  border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.95rem', lineHeight: '1.5', boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', background: 'var(--bg-card)' }}>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              className="input-field"
              placeholder="Hỏi AI về Ví tiền của bạn..."
              style={{ padding: '10px 16px', fontSize: '0.95rem', flex: 1, borderRadius: '24px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span>➤</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
