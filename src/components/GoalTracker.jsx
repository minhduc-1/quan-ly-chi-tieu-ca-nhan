import { useState } from 'react';

export default function GoalTracker({ goals, onAddGoalClick }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '500', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Mục tiêu</h3>
        <button 
          onClick={onAddGoalClick}
          style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1rem', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          title="Thêm mục tiêu mới"
        >
          +
        </button>
      </div>
      
      {goals.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>Bấm dấu + để thêm mục tiêu mới.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {goals.map(goal => {
            const percentComplete = Math.min(100, Math.round((goal.saved / goal.targetAmount) * 100));
            return (
              <div key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{goal.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{percentComplete}%</span>
                </div>
                
                <div style={{ width: '100%', height: '4px', background: 'var(--input-border)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentComplete}%`, height: '100%', background: 'white', transition: 'width 0.5s ease' }}></div>
                </div>
                
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{goal.saved.toLocaleString('vi-VN')} đ</span>
                  <span>{goal.targetAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
