import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { saveData, loadData } from '../services/StorageService';

export default function BillReminder({ user }) {
  // Mặc định nhắc nhở
  const defaultBills = [
    { id: '1', name: 'Tiền Điện', dueDate: 15, isPaid: false },
    { id: '2', name: 'Tiền Nước', dueDate: 20, isPaid: false },
    { id: '3', name: 'Internet / Viễn thông', dueDate: 5, isPaid: false }
  ];

  const [bills, setBills] = useState(() => loadData('bills_' + (user?.email || ''), defaultBills));
  const currentDay = new Date().getDate();
  const currentMonth = new Date().getMonth(); 

  useEffect(() => {
    // Reset isPaid state if we enter a new month (simplified logic)
    const storedMonth = loadData('bills_month_' + (user?.email || ''), currentMonth);
    if (storedMonth !== currentMonth) {
      const resetBills = bills.map(b => ({ ...b, isPaid: false }));
      setBills(resetBills);
      saveData('bills_month_' + user?.email, currentMonth);
    }
  }, [currentMonth, user]);

  useEffect(() => {
    if (user) saveData('bills_' + user.email, bills);
  }, [bills, user]);

  const togglePaid = (id) => {
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="friendly-card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
        <Calendar size={20} color="var(--primary)" /> Nhắc Nhở Hóa Đơn Tháng Này
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bills.sort((a,b) => a.dueDate - b.dueDate).map((bill) => {
          const isOverdue = !bill.isPaid && currentDay > bill.dueDate;
          const isSoon = !bill.isPaid && (bill.dueDate - currentDay) >= 0 && (bill.dueDate - currentDay) <= 3;

          return (
            <div 
              key={bill.id} 
              onClick={() => togglePaid(bill.id)}
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px', background: 'var(--surface-base)', borderRadius: '16px', 
                border: `1px solid ${isOverdue ? 'var(--danger-bg)' : isSoon ? 'var(--warning-bg)' : 'var(--border-glass)'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: bill.isPaid ? 'var(--success)' : 'var(--text-muted)' }}>
                  {bill.isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </div>
                <div>
                   <div style={{ fontWeight: '600', color: bill.isPaid ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: bill.isPaid ? 'line-through' : 'none' }}>
                     {bill.name}
                   </div>
                   <div style={{ fontSize: '13px', color: isOverdue ? 'var(--danger)' : isSoon ? 'var(--warning)' : 'var(--text-secondary)', marginTop: '4px' }}>
                     Hạn chót: Ngày {bill.dueDate} hàng tháng
                     {isOverdue && ' (Đã quá hạn)'}
                     {isSoon && ' (Sắp tới hạn)'}
                   </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  );
}
