import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Coins } from 'lucide-react';

export default function GoalForm({ onClose, onAdd }) {
  const [formData, setFormData] = useState({ name: '', target: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.target) return;

    onAdd({
      id: Date.now().toString(),
      name: formData.name,
      target: parseInt(formData.target),
      current: 0,
      percent: 0
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        className="friendly-card" 
        style={{ width: '100%', maxWidth: '420px', padding: '32px', position: 'relative' }}
      >
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px', border: 'none' }}>
           <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target color="var(--accent)" size={24}/> Chinh Phục Ước Mơ
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Tuyệt kỷ tiết kiệm tiền đỉnh cao là chia nhỏ cái mốc to tướng thành các trạm nhỏ.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Tên Thử Thách Tiết Kiệm</label>
            <input
               type="text"
               required
               className="input-glass"
               placeholder="Vd: Mua xe, Đám cưới, Màn hình Máy tính..."
               value={formData.name}
               onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>Tổng số tiền khao khát (VND)</label>
            <div style={{ position: 'relative' }}>
              <Coins size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}/>
              <input
                 type="number"
                 required
                 min="1000"
                 className="input-glass"
                 placeholder="Vd: 50000000"
                 style={{ paddingLeft: '48px' }}
                 value={formData.target}
                 onChange={(e) => setFormData({...formData, target: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '14px' }}>Khởi Động Ngay</button>
        </form>
      </motion.div>
    </div>
  );
}
