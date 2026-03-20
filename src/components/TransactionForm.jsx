import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Tags } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function TransactionForm({ onClose, onAdd }) {
  const [smartInput, setSmartInput] = useState('');
  const [parsedData, setParsedData] = useState({ category: 'Khác', amount: '', note: '' });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [useAI, setUseAI] = useState(false); // Toggle scan receipt
  
  // AI Simulation: Tự động Bóc tách chuỗi (VD: "Uống trà đá 15k" => 15000)
  useEffect(() => {
    if (!smartInput) {
      setParsedData({ category: 'Khác', amount: '', note: '' });
      return;
    }
    
    let noteStr = smartInput;
    let amountVal = '';
    
    // Tìm con số (có thể có k, m phía sau)
    const match = smartInput.match(/(\d+)(k|m|tr|ngàn|nghin)?/i);
    if (match) {
       let num = parseInt(match[1]);
       const suffix = match[2]?.toLowerCase();
       if (suffix === 'k' || suffix === 'ngàn' || suffix === 'nghin') num *= 1000;
       if (suffix === 'm' || suffix === 'tr') num *= 1000000;
       amountVal = num;
       noteStr = smartInput.replace(match[0], '').trim();
    }
    
    // Gợi ý danh mục từ Note
    const txt = noteStr.toLowerCase();
    let cat = 'Khác';
    if (txt.includes('ăn') || txt.includes('uống') || txt.includes('phở') || txt.includes('cafe') || txt.includes('trà')) cat = 'Ăn uống';
    else if (txt.includes('đi') || txt.includes('xăng') || txt.includes('grab')) cat = 'Di chuyển';
    else if (txt.includes('điện') || txt.includes('nước') || txt.includes('nhà')) cat = 'Sinh hoạt';
    else if (txt.includes('lương') || txt.includes('thưởng')) cat = 'Lương/Thưởng';
    else if (txt.includes('sắm') || txt.includes('đồ') || txt.includes('quần áo')) cat = 'Mua sắm';

    setParsedData({ category: cat, amount: amountVal, note: noteStr || 'Giao dịch nhanh' });
  }, [smartInput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsedData.amount) {
      alert('Vui lòng nhập rõ số tiền (VD: Ăn bún đậu 35k)');
      return;
    }
    
    // Thu hay Chi? (Thu: Lương/Thưởng, Bán hàng)
    const isIncome = parsedData.category === 'Lương/Thưởng' || parsedData.note.toLowerCase().includes('lương');
    const finalAmount = isIncome ? Math.abs(parsedData.amount) : -Math.abs(parsedData.amount);

    onAdd({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      category: parsedData.category,
      amount: finalAmount,
      note: parsedData.note || 'Thu chi tự động'
    });
    onClose();
  };

  const handleImageOCR = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setIsAiProcessing(true);
    try {
       const result = await Tesseract.recognize(file, 'vie');
       const text = result.data.text;
       // Tìm số to nhất làm tổng tiền
       const numbers = text.match(/\d+(?:[.,]\d+)?/g);
       if (numbers) {
         const max = Math.max(...numbers.map(n => parseInt(n.replace(/\D/g, ''))));
         if (max > 1000) setSmartInput(`Thanh toán ảnh chụp ${max}`);
         else alert('AI không tìm thấy số tiền hợp lệ trên hoá đơn này!');
       }
    } catch(err) {
       console.error("Lỗi AI OCR", err);
    }
    setIsAiProcessing(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="friendly-card" 
        style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}
      >
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px', border: 'none' }}>
           <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles color="var(--primary)" size={24}/> Ghi Chép Thông Minh
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Chỉ cần gõ theo thói quen tự nhiên. AI sẽ tự động phân loại. <br/> 
          <i>Ví dụ: "Ăn bít tết 250k" hoặc "Mẹ gửi 5tr"</i>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ position: 'relative' }}>
             <input
                type="text"
                autoFocus
                className="input-glass"
                placeholder="Nhấn gõ Giao dịch của bạn..."
                style={{ fontSize: '1.2rem', padding: '16px 20px', borderRadius: '16px' }}
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
             />
             <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                AI Gợi ý
             </div>
          </div>

          <AnimatePresence>
            {smartInput && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ background: 'var(--surface-opaque)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Loại danh mục</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      <Tags size={16} color="var(--accent)" /> {parsedData.category}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tính toán Vốn</label>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: parsedData.amount ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {parsedData.amount ? `${parsedData.amount.toLocaleString()} đ` : 'Chưa rõ số tiền'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Công cụ quét Hoá đơn nâng cao */}
          <div style={{ padding: '16px', background: 'var(--warning-bg)', borderRadius: '12px', border: '1px dashed var(--warning)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', color: 'var(--warning)' }}>
               {isAiProcessing ? '🤖 Nơ-ron xử lý thần kinh đang nảy số...' : '📸 Hoặc Tải ảnh Chụp Hoá Đơn / Bill tính tiền để AI quét (BETA)'}
               <input type="file" accept="image/*" onChange={handleImageOCR} disabled={isAiProcessing} style={{ display: 'none' }} />
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '16px', borderRadius: '16px', fontSize: '16px' }} disabled={!parsedData.amount}>
            <Send size={20} /> Lưu Giao Dịch
          </button>
        </form>
      </motion.div>
    </div>
  );
}
