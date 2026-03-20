import { motion } from 'framer-motion';
import { Target, Flag, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function GoalTracker({ goals, currency }) {
  if (!goals || goals.length === 0) return null;

  return (
    <div className="friendly-card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={20} color="var(--primary)" /> Săn Mục Tiêu (Goals)
      </h3>
      
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
                 <span className="badge primary">{percent.toFixed(0)}%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                 <span>Đãgom {formatCurrency(goal.current, currency)}</span>
                 <span>Mục tiêu {formatCurrency(goal.target, currency)}</span>
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
