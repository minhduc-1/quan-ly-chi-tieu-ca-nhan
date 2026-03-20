import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadData, saveData } from '../services/StorageService';
import { ShieldCheck, Trash2, XCircle, Users, Activity, LogOut } from 'lucide-react';

export default function AdminDashboard({ usersDB, setUsersDB, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    setLogs(loadData('audit_logs', []));
  }, []);

  const handleClearLogs = () => {
    if(window.confirm('Cậu có chắc muốn xoá sạch lịch sử hoạt động không? Gần như không thể khôi phục lại đâu đấy!')) {
       saveData('audit_logs', []);
       setLogs([]);
    }
  };

  const handleDeleteUser = (email) => {
    if (email === 'admin@gmail.com') return alert('Chống chỉ định xoá Giám Đốc Hệ Thống nhé!');
    if (window.confirm(`Bạn muốn xoá vĩnh viễn tài khoản ${email}? Dữ liệu của họ sẽ bị bỏ lại bơ vơ đó.`)) {
        const newDB = usersDB.filter(u => u.email !== email);
        setUsersDB(newDB);
    }
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
                     <thead style={{ background: 'var(--bg-app)' }}>
                       <tr>
                         <th style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>Thành Viên</th>
                         <th style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>Email Đăng Nhập</th>
                         <th style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>Sinh Mệnh (Role)</th>
                         <th style={{ padding: '20px 24px', color: 'var(--text-secondary)', textAlign: 'right' }}>Thao Tác</th>
                       </tr>
                     </thead>
                     <tbody>
                       {usersDB.map((u, idx) => (
                         <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                           <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <img src={`https://ui-avatars.com/api/?name=${u.name.replace(' ','+')}&background=0d9488&color=fff&rounded=true`} alt="Avatar" width="36" height="36" style={{ borderRadius: '50%' }} />
                                 <span style={{ fontWeight: '600' }}>{u.name}</span>
                              </div>
                           </td>
                           <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{u.email}</td>
                           <td style={{ padding: '20px 24px' }}>
                              <span className={`badge ${u.role === 'admin' ? 'danger' : 'success'}`}>
                                 {u.role === 'admin' ? 'Giám Đốc (Boss)' : 'Khách Hàng (User)'}
                              </span>
                           </td>
                           <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteUser(u.email)} disabled={u.role === 'admin'} className="btn-icon" style={{ borderColor: 'transparent', color: u.role === 'admin' ? 'var(--text-muted)' : 'var(--danger)', marginLeft: 'auto' }}>
                                 <Trash2 size={18} />
                              </button>
                           </td>
                         </tr>
                       ))}
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
