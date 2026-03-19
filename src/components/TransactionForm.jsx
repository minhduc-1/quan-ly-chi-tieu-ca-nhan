import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function TransactionForm({ onClose, onAdd }) {
  const [formData, setFormData] = useState({ 
     date: new Date().toISOString().split('T')[0], 
     category: 'Ăn uống', 
     amount: '', 
     note: '', 
     emotion: 'Thường' 
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const categories = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Hóa đơn', 'Giải trí', 'Lương', 'Thu nhập khác'];
  const emotions = [
     { label: 'Vui vẻ', emoji: '😄' },
     { label: 'Thường', emoji: '😐' },
     { label: 'Buồn chán', emoji: '😢' },
     { label: 'Tức giận', emoji: '😡' }
  ];

  const handleImageOCR = (e) => {
     const file = e.target.files[0];
     if(!file) return;
     setIsScanning(true);
     setScanProgress(0);
     Tesseract.recognize(file, 'vie+eng', { 
        logger: m => { if(m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100)); } 
     }).then(({ data: { text } }) => {
        setIsScanning(false);
        const matches = text.match(/\d+([\.,]\d+)*/g);
        if (matches && matches.length > 0) {
           const nums = matches.map(s => parseFloat(s.replace(/,/g, '').replace(/\./g, ''))).filter(n => !isNaN(n));
           const maxNum = Math.max(...nums);
           if (maxNum > 0) {
              setFormData(prev => ({ ...prev, amount: maxNum }));
              alert(`🤖 Trí tuệ AI nhận diện được con số Lớn Nhất trên Hoá đơn: ${maxNum} đ`);
           }
        } else alert('🤖 AI Không phân tích được ký tự số nào rõ ràng trên ảnh.');
     }).catch(() => {
        setIsScanning(false);
        alert('Lỗi khởi tạo Neural OCR.');
     });
  };

  const handleCategoryChange = (e) => {
     const cat = e.target.value;
     let suggestedNote = '';
     if (cat === 'Ăn uống') suggestedNote = 'Bữa ăn ngoài';
     if (cat === 'Di chuyển') suggestedNote = 'Đổ xăng / Gọi xe';
     if (cat === 'Hóa đơn') suggestedNote = 'Thanh toán hoá đơn dịch vụ';
     if (cat === 'Lương') suggestedNote = 'Lương tháng định kì';

     setFormData(prev => ({ ...prev, category: cat, note: prev.note || suggestedNote }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount)) return;
    
    let isIncome = (formData.category === 'Lương' || formData.category === 'Thu nhập khác');
    const finalAmount = isIncome ? Math.abs(Number(formData.amount)) : -Math.abs(Number(formData.amount));

    onAdd({
      id: Date.now().toString(),
      ...formData,
      amount: finalAmount
    });
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px', maxHeight: '95vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Khai Báo Giao Dịch</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ padding: '15px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '8px', border: '1px dashed #3498db', marginBottom: '20px', textAlign: 'center' }}>
           <h4 style={{ margin: '0 0 10px 0', color: '#3498db', fontSize: '0.9rem' }}>🤖 Máy Quét Hoá Đơn AI (OCR)</h4>
           {isScanning ? (
              <div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Trí tuệ Nhân tạo đang phân tích chữ viết trên ảnh ({scanProgress}%)...</div>
                 <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                    <div style={{ width: `${scanProgress}%`, height: '100%', background: '#3498db', transition: 'width 0.2s' }}></div>
                 </div>
              </div>
           ) : (
              <label style={{ cursor: 'pointer', color: '#3498db', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                 📷 Tải lên Biên Lai Hoá đơn
                 <input type="file" accept="image/*" onChange={handleImageOCR} style={{ display: 'none' }} />
              </label>
           )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Tính Trạng Cảm Xúc Lúc Mua Hàng</label>
            <div style={{ display: 'flex', gap: '10px' }}>
               {emotions.map(emo => (
                  <div key={emo.label} onClick={() => setFormData({...formData, emotion: emo.label})}
                       style={{ flex: 1, textAlign: 'center', padding: '10px', background: formData.emotion === emo.label ? 'rgba(52, 152, 219, 0.2)' : 'var(--bg-main)', border: formData.emotion === emo.label ? '2px solid #3498db' : '2px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem', transition: 'all 0.2s' }}>
                     {emo.emoji}
                  </div>
               ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Ngày Ghi Sổ</label>
            <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Nhóm Phân Loại Báo Cáo</label>
            <select className="input-field" value={formData.category} onChange={handleCategoryChange}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Số Tiền Khai Báo Thực Tế (VNĐ)</label>
            <input type="number" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0 đ" required/>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Diễn Giải Bổ Sung (Auto-suggest)</label>
            <input type="text" className="input-field" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Bạn đã mua gì..."/>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Lưu Hồ Sơ</button>
        </form>
      </div>
    </div>
  );
}
