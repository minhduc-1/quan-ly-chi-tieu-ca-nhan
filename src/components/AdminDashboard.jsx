import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadData, saveData } from '../services/StorageService';
import { ShieldCheck, Trash2, XCircle, Users, Activity, LogOut } from 'lucide-react';

export default function AdminDashboard({ usersDB, setUsersDB, onLogout, allTransactions = [] }) {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    setLogs(loadData('audit_logs', []));
  }, []);

  const handleClearLogs = () => {
    if(window.confirm('Giám đốc có chắc muốn xoá sạch lịch sử hoạt động không? Tài liệu mật sẽ biến mất vĩnh viễn!')) {
       saveData('audit_logs', []);
       setLogs([]);
    }
  };

  const handleDeleteUser = (email) => {
    if (email === 'adminwed@gmail.com') return alert('Lỗi: Bạn không thể tự sát (Xoá tài khoản Giám Đốc Hệ Thống)!');
    if (window.confirm(`LỆNH TỬ HÌNH: Bạn muốn xoá vĩnh viễn tài khoản ${email}? Họ sẽ mất quyền truy cập mãi mãi.`)) {
        const newDB = usersDB.filter(u => u.email !== email);
        setUsersDB(newDB);
    }
  };

  const handleWarnUser = (email, isWarned) => {
    if (email === 'adminwed@gmail.com') return alert('Không thể răn đe bản thân Giám Đốc!');
    const actionName = isWarned ? 'GỠ CẢNH CÁO KHỎI' : 'PHẠT THẺ CẢNH CÁO ĐỐI VỚI';
    if (window.confirm(`XÁC NHẬN: Bạn muốn ${actionName} tài khoản ${email}?`)) {
        const newDB = usersDB.map(u => u.email === email ? { ...u, isWarned: !isWarned } : u);
        setUsersDB(newDB);
    }
  };

  // Helper tính toán giao dịch
  const getUserStats = (email) => {
     const txs = allTransactions.filter(t => t.owner === email);
     const totalAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
     const hasIrregular = txs.some(t => Math.abs(t.amount) > 100000000); // Giao dịch trên 100M VND là bất thường
     return { txCount: txs.length, totalAmount, hasIrregular };
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '24px 40px' }}>
       
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <header className="friendly-card" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
             <div>
                <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  <ShieldCheck size={32} /> Phân Trạm Giám Đốc (Super Admin)
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '15px' }}>
                  Chào sếp! Đây là nơi quản lý mọi thần dân và nhìn thấu mọi hành động trong App.
                </p>
             </div>
             
             <div style={{ display: 'flex', gap: '16px' }}>
               <button onClick={onLogout} className="btn-secondary" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                 <LogOut size={18} /> Nghỉ ngơi & Đăng xuất
               </button>
             </div>
          </header>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
             <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} style={{ display: 'flex', gap: '8px' }}>
                <Users size={18} /> Quản lý Cộng đồng ({usersDB.length} Thành viên)
             </button>
             <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'} style={{ display: 'flex', gap: '8px' }}>
                <Activity size={18} /> Xem lại Camera (Audit Logs)
             </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'users' ? (
              <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="friendly-card" style={{ padding: '0', overflow: 'hidden' }}>
                   <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                     <thead style={{ background: 'var(--primary-bg)' }}>
                       <tr>
                         <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Thành Viên</th>
                         <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Chi Tiết & Báo Cáo</th>
                         <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Trạng Thái</th>
                         <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'right' }}>Thao Tác (Phạt / Xoá)</th>
                       </tr>
                     </thead>
                     <tbody>
                       {usersDB.map((u, idx) => {
                         const stats = getUserStats(u.email);
                         return (
                         <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', background: u.isWarned ? 'var(--danger-bg)' : 'transparent' }}>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <div style={{ position: 'relative' }}>
                                   <img src={`https://ui-avatars.com/api/?name=${u.name.replace(' ','+')}&background=0d9488&color=fff&rounded=true`} alt="Avatar" width="40" height="40" style={{ borderRadius: '50%', border: u.role === 'admin' ? '2px solid var(--primary)' : 'none' }} />
                                   {stats.hasIrregular && <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></div>}
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{u.name}</span>
                                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.email}</span>
                                 </div>
                              </div>
                           </td>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Vào cuối: <b>{u.lastActive || 'Chưa từng'}</b></span>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng GD: <b style={{ color: stats.hasIrregular ? 'var(--danger)' : 'var(--text-primary)' }}>{stats.txCount} mục</b></span>
                                {stats.hasIrregular && <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>⚠️ Phát hiện Dòng tiền Lớn</span>}
                              </div>
                           </td>
                           <td style={{ padding: '16px 24px' }}>
                              <span className={`badge ${u.role === 'admin' ? 'primary' : u.isWarned ? 'danger' : 'success'}`}>
                                 {u.role === 'admin' ? 'Giám Đốc (Boss)' : u.isWarned ? 'Bị Canh Chừng' : 'Hoạt Động Tốt'}
                              </span>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleWarnUser(u.email, u.isWarned)} disabled={u.role === 'admin'} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px', border: u.isWarned ? 'transparent' : '1px solid var(--border-light)', background: u.isWarned ? 'transparent' : 'var(--surface-base)', color: u.isWarned ? 'var(--text-primary)' : 'var(--warning)', fontWeight: 'bold' }}>
                                   {u.isWarned ? 'X Gỡ Phạt' : 'Rút Thẻ Phạt'}
                                </button>
                                <button onClick={() => handleDeleteUser(u.email)} disabled={u.role === 'admin'} className="btn-icon" style={{ borderColor: 'transparent', background: u.role === 'admin' ? 'transparent' : 'var(--danger-bg)', color: u.role === 'admin' ? 'var(--text-muted)' : 'var(--danger)' }}>
                                   <Trash2 size={18} />
                                </button>
                              </div>
                           </td>
                         </tr>
                       )})}
                     </tbody>
                   </table>
                 </div>
              </motion.div>
            ) : (
              <motion.div key="logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="friendly-card" style={{ padding: '0', overflow: 'hidden' }}>
                     <div style={{ padding: '16px 24px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Mọi hành động nhấp chuột đều được âm thầm ghi lại tại đây.</span>
                         <button onClick={handleClearLogs} className="btn-secondary" style={{ padding: '8px 16px', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
                           <Trash2 size={16} /> Dọn rác Logs
                         </button>
                     </div>
                     <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                       <tbody>
                         {logs.map((log, idx) => (
                           <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                             <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                             <td style={{ padding: '16px 24px', fontWeight: 'bold', color: 'var(--primary)' }}>{log.user}</td>
                             <td style={{ padding: '16px 24px' }}>
                                <span className="badge" style={{ background: 'var(--bg-app)', border: '1px solid var(--border-light)' }}>
                                   {log.action}
                                </span>
                             </td>
                             <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{log.details}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     {logs.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chà, camera rỗng tuếch. Chẳng có ai làm gì ở đây cả.</div>
                     )}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

       </motion.div>
    </div>
  );
}
