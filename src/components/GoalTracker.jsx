import { motion } from 'framer-motion';
import { Target, Flag, Zap, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function GoalTracker({ goals, currency, onDeleteGoal }) {
  if (!goals || goals.length === 0) return null;

  return (
    <div className="friendly-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {goals.map((goal, index) => {
          const percent = goal.percent || Math.min((goal.current / goal.target) * 100, 100);
          
          return (
            <motion.div 
              key={goal.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{ padding: '16px', background: 'var(--surface-opaque)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Flag size={16} color="var(--accent)" /> {goal.name}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span className="badge primary">{percent.toFixed(0)}%</span>
                   <button 
                      onClick={() => onDeleteGoal && onDeleteGoal(goal.id)}
                      className="btn-icon" 
                      style={{ padding: '4px', color: 'var(--danger)', opacity: 0.7, border: 'none' }}
                      title="Xóa mục tiêu này"
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                   >
                      <Trash2 size={16} />
                   </button>
                 </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                 <span>Đã tích lũy: {formatCurrency(goal.current, currency)}</span>
                 <span>Mục tiêu: {formatCurrency(goal.target, currency)}</span>
              </div>
              
              <div style={{ height: '8px', background: 'var(--border-glass)', borderRadius: '10px', overflow: 'hidden' }}>
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${percent}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', borderRadius: '10px' }}
                 ></motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
