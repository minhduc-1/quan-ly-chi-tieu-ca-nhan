import { useState } from 'react';

export default function GoalForm({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [current, setCurrent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !targetAmount || isNaN(targetAmount)) {
      alert("Vui lòng nhập tên và số tiền mục tiêu hợp lệ.");
      return;
    }
    const tAmt = Number(targetAmount);
    const cAmt = Number(current) || 0;
    
    const newGoal = {
      id: Date.now().toString(),
      name,
      target: tAmt,
      current: cAmt,
      percent: tAmt > 0 ? Math.min(100, Math.round((cAmt / tAmt) * 100)) : 0
    };
    onAdd(newGoal);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
          ✕
        </button>
        
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: 'var(--bg-topbar)' }}>Thiết Lập Mục Tiêu</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Tên mục tiêu</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="VD: Mua xe máy, Đi du lịch..."
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Đích đến (VNĐ)</label>
            <input 
              type="number" 
              value={targetAmount} 
              onChange={e => setTargetAmount(e.target.value)}
              className="input-field"
              placeholder="10000000"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Số dư đã có (VNĐ)</label>
            <input 
              type="number" 
              value={current} 
              onChange={e => setCurrent(e.target.value)}
              className="input-field"
              placeholder="0"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>Tạo Mục Tiêu</button>
        </form>
      </div>
    </div>
  );
}
