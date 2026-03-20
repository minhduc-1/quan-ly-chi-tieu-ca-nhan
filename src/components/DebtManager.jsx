import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/format';
import { logAction } from '../services/AuditService';
import { Users, AlertCircle, CheckCircle2, UserPlus, FileSpreadsheet } from 'lucide-react';

export default function DebtManager({ currency }) {
  const [debts, setDebts] = useState([
     { id: 1, type: 'borrowed', amount: 500000, person: 'Nguyễn Văn A', note: 'Vay ăn trưa', date: '21/04/2026', status: 'pending' },
     { id: 2, type: 'lent', amount: 1500000, person: 'Trần Thị B', note: 'Tiền nhà tháng 4', date: '20/04/2026', status: 'pending' }
  ]);
  const [showSplit, setShowSplit] = useState(false);

  const handleMarkPaid = (id) => {
    setDebts(debts.map(d => d.id === id ? { ...d, status: 'paid' } : d));
    logAction('user', 'Xóa Nợ', `Xác nhận đã thanh toán/đòi thành công khoản nợ ID: ${id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Tính năng chia Split Bill */}
      <div className="friendly-card" style={{ padding: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                 <Users size={24} color="var(--primary)" /> Chia Tiền Nhóm (Split Bill)
               </h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                 Tự động chia hoá đơn đi nhậu, tiền phòng trọ và ghi sổ nợ tự động.
               </p>
            </div>
            <button onClick={() => setShowSplit(!showSplit)} className="btn-primary">
               {showSplit ? 'Huỷ Chia' : '+ Tạo Phiếu Chia Tiền'}
            </button>
         </div>

         <AnimatePresence>
           {showSplit && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }} 
               animate={{ opacity: 1, height: 'auto' }} 
               exit={{ opacity: 0, height: 0 }}
               style={{ overflow: 'hidden', marginTop: '24px' }}
             >
                <div style={{ background: 'var(--surface-opaque)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <input type="text" placeholder="Nhập tổng bill (VD: 3000000)" className="input-glass" />
                      <input type="number" placeholder="Số người chia (VD: 4)" className="input-glass" />
                   </div>
                   <input type="text" placeholder="Tên từng người (Cách nhau bởi dấu phẩy)" className="input-glass" />
                   <button className="btn-primary" style={{ background: 'var(--success)' }}>
                      <FileSpreadsheet size={18} /> Phân Bổ Nợ Nhanh
                   </button>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Danh sách Sổ Nợ */}
      <div className="friendly-card" style={{ padding: '24px' }}>
         <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
           <AlertCircle size={20} color="var(--danger)" /> Danh Sách Cần Đòi / Phải Trả
         </h3>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {debts.map(debt => (
              <motion.div 
                key={debt.id} 
                whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                style={{ 
                   padding: '20px', background: 'var(--surface-opaque)', borderRadius: '16px', 
                   border: `1px solid ${debt.status === 'paid' ? 'var(--success)' : 'var(--border-glass)'}`,
                   opacity: debt.status === 'paid' ? 0.6 : 1, position: 'relative'
                }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`badge ${debt.type === 'lent' ? 'success' : 'danger'}`}>
                       {debt.type === 'lent' ? 'Cho Vay (Cần đòi)' : 'Đi Vay (Cần trả)'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{debt.date}</span>
                 </div>
                 
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {formatCurrency(debt.amount, currency)}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    <UserPlus size={16} /> Đối tác: <strong>{debt.person}</strong>
                 </div>
                 
                 {debt.status === 'pending' ? (
                    <button onClick={() => handleMarkPaid(debt.id)} className="btn-primary" style={{ width: '100%', background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                      Xác Nhận Đã Xong
                    </button>
                 ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--success)', padding: '12px', background: 'var(--success-bg)', borderRadius: '12px', fontWeight: 'bold' }}>
                       <CheckCircle2 size={18} /> Đã Thanh Toán
                    </div>
                 )}
              </motion.div>
            ))}
         </div>
      </div>

    </motion.div>
  );
}
