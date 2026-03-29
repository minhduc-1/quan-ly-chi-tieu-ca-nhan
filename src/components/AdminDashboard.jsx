import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadData, saveData } from '../services/StorageService';
import { 
  ShieldCheck, Trash2, Users, Activity, LogOut, LayoutDashboard, 
  Settings as SettingsIcon, Megaphone, Lock, Unlock, RotateCcw, 
  AlertTriangle, Search, CheckCircle, XCircle 
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function AdminDashboard({ usersDB, setUsersDB, onLogout, allTransactions = [] }) {
  // Tabs: 'dashboard', 'users', 'system', 'logs'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // System Data States
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [systemCategories, setSystemCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    setLogs(loadData('audit_logs', []));
    setBroadcastMsg(loadData('system_broadcast', ''));
    setSystemCategories(loadData('system_categories', ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Lương', 'Đầu tư']));
  }, []);

  const saveBroadcast = () => {
    saveData('system_broadcast', broadcastMsg);
    alert('Đã phát thanh thông báo thành công đến toàn bộ thành viên!');
  };

  const handleAddCat = () => {
    if(!newCat.trim()) return;
    const newDb = [...systemCategories, newCat.trim()];
    setSystemCategories(newDb);
    saveData('system_categories', newDb);
    setNewCat('');
  };
  
  const handleDelCat = (cat) => {
    const newDb = systemCategories.filter(c => c !== cat);
    setSystemCategories(newDb);
    saveData('system_categories', newDb);
  };

  // ---------------- ACTION HANDLERS ---------------- //

  const handleClearLogs = () => {
    if(window.confirm('Giám đốc có chắc muốn xoá sạch lịch sử hoạt động không? Tài liệu mật sẽ biến mất vĩnh viễn!')) {
       saveData('audit_logs', []);
       setLogs([]);
    }
  };

  // Toggle IsDeleted (Soft Delete)
  const handleToggleDelete = (email, currentState) => {
    if (email === 'adminwed@gmail.com') return alert('CẢNH BÁO: Giám đốc không thể tự sát (xoá tài khoản của mình)!');
    const action = currentState ? 'KHÔI PHỤC TÀI KHOẢN' : 'TỬ HÌNH TÀI KHOẢN (ĐƯA VÀO RÁC)';
    if (window.confirm(`XÁC NHẬN: Bạn muốn ${action} ${email}?`)) {
        const newDB = usersDB.map(u => u.email === email ? { ...u, isDeleted: !currentState } : u);
        setUsersDB(newDB);
    }
  };

  // Toggle IsLocked (Khóa)
  const handleToggleLock = (email, currentState) => {
    if (email === 'adminwed@gmail.com') return alert('CẢNH BÁO: Giám đốc không thể tự nhốt mình!');
    const action = currentState ? 'MỞ KHÓA' : 'TẠM GIAM';
    if (window.confirm(`XÁC NHẬN: Bạn muốn ${action} tài khoản ${email}?`)) {
        const newDB = usersDB.map(u => u.email === email ? { ...u, isLocked: !currentState } : u);
        setUsersDB(newDB);
    }
  };

  // Toggle Warning (Cảnh báo mờ ám)
  const handleToggleWarn = (email, currentState) => {
    if (email === 'adminwed@gmail.com') return alert('Không thể thao tác lên chính mình!');
    const actionName = currentState ? 'GỠ CỜ CẢNH CÁO' : 'CẮM CỜ PHẠT';
    if (window.confirm(`XÁC NHẬN: ${actionName} tài khoản ${email}?`)) {
        const newDB = usersDB.map(u => u.email === email ? { ...u, isWarned: !currentState } : u);
        setUsersDB(newDB);
    }
  };

  // Reset Password khẩn cấp
  const handleResetPassword = (email) => {
    if (email === 'adminwed@gmail.com') return alert('Không thể tự Reset Password bằng đường này!');
    if (window.confirm(`QUYỀN SINH SÁT: Bạn muốn đặt lại mật khẩu của ${email} thành "123456"?`)) {
        const securePwd = CryptoJS.SHA256("123456").toString();
        const newDB = usersDB.map(u => u.email === email ? { ...u, password: securePwd } : u);
        setUsersDB(newDB);
        alert(`Thành công! Mật khẩu của ${email} đã trở về: 123456`);
    }
  };

  // ---------------- ANALYTICS DATA ---------------- //
  
  const getUserStats = (email) => {
     const txs = allTransactions.filter(t => t.owner === email);
     const totalAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
     const hasIrregular = txs.some(t => Math.abs(t.amount) > 100000000); 
     return { txCount: txs.length, totalAmount, hasIrregular };
  };

  const totalUsers = usersDB.length;
  const activeUsers = usersDB.filter(u => (!u.isDeleted && !u.isLocked)).length;
  const lockedUsers = usersDB.filter(u => (u.isLocked || u.isWarned) && !u.isDeleted).length;
  const deletedUsers = usersDB.filter(u => u.isDeleted).length;
  
  const totalMoneyFlow = allTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // Growth Line Chart Data
  const usersByDate = usersDB.reduce((acc, u) => {
    const d = u.createdAt ? u.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10);
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const lineChartData = Object.keys(usersByDate).map(date => ({ date, Users: usersByDate[date] })).sort((a,b) => a.date.localeCompare(b.date));

  // Cumulative data for Line Chart (thể hiện sự tăng trưởng tổng dần)
  let cumulativeCount = 0;
  const cumulativeData = lineChartData.map(item => {
    cumulativeCount += item.Users;
    return { date: item.date, 'Tổng User': cumulativeCount };
  });

  // Pie Chart Data
  const pieData = [
     { name: 'Sạch Sẽ', value: activeUsers, color: '#10b981' }, 
     { name: 'Trong Tầm Ngắm', value: lockedUsers, color: '#f59e0b' },
     { name: 'Đã Bị Tiêu Diệt', value: deletedUsers, color: '#ef4444' }
  ];

  const filteredUsers = usersDB.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
       
       {/* SIDEBAR */}
       <aside style={{ width: '260px', background: 'var(--surface-base)', borderRight: '1px solid var(--border-light)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
            <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '12px' }}>
               <ShieldCheck size={28} color="var(--primary)" />
            </div>
            <div>
               <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '900', color: 'var(--primary)' }}>S. KH</h2>
               <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PHÂN KÌ QUẢN TRỊ V2</span>
            </div>
          </div>

          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} style={{ justifyContent: 'flex-start', border: activeTab !== 'dashboard' && 'none' }}>
             <LayoutDashboard size={18} /> Tổng Quan
          </button>
          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} style={{ justifyContent: 'flex-start', border: activeTab !== 'users' && 'none' }}>
             <Users size={18} /> Quản Lý Dân Cư
          </button>
          <button onClick={() => setActiveTab('system')} className={activeTab === 'system' ? 'btn-primary' : 'btn-secondary'} style={{ justifyContent: 'flex-start', border: activeTab !== 'system' && 'none' }}>
             <SettingsIcon size={18} /> Cấu Hình / Phát Loa
          </button>
          <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'} style={{ justifyContent: 'flex-start', border: activeTab !== 'logs' && 'none' }}>
             <Activity size={18} /> Camera Máy Chủ
          </button>
          
          <button onClick={onLogout} className="btn-secondary" style={{ marginTop: 'auto', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
             <LogOut size={18} /> Đăng Xuất An Toàn
          </button>
       </aside>

       {/* MAIN CONTENT */}
       <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
          
          <AnimatePresence mode="wait">
             
             {/* DASHBOARD TAB */}
             {activeTab === 'dashboard' && (
               <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ marginBottom: '32px' }}>
                     <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>Báo cáo Tổng Quan Hệ Thống</h1>
                     <span style={{ color: 'var(--text-muted)' }}>Cập nhật theo thời gian thực (Real-time Simulation)</span>
                  </div>
                  
                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                     <div className="friendly-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                           <Users size={18} /> TỔNG CƯ DÂN
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>{totalUsers}</span>
                     </div>
                     <div className="friendly-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                           <Activity size={18} /> LƯU LƯỢNG GIAO DỊCH
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--success)' }}>{allTransactions.length}</span>
                     </div>
                     <div className="friendly-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                           <ShieldCheck size={18} /> GDP HỆ THỐNG
                        </div>
                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#8b5cf6' }}>{(totalMoneyFlow / 1000000).toFixed(1)}Tr</span>
                     </div>
                  </div>

                  {/* Charts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                     <div className="friendly-card">
                        <h3 style={{ marginBottom: '16px' }}>Tăng Trưởng Hệ Sinh Thái Đăng Ký</h3>
                        <div style={{ height: '300px' }}>
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={cumulativeData}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                 <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                 <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                 <Tooltip wrapperStyle={{ borderRadius: '12px' }} />
                                 <Line type="monotone" dataKey="Tổng User" stroke="var(--primary)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <div className="friendly-card">
                        <h3 style={{ marginBottom: '16px' }}>Thống Kê An Cư Dân</h3>
                        <div style={{ height: '300px' }}>
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                                   {pieData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.color} />
                                   ))}
                                 </Pie>
                                 <Tooltip wrapperStyle={{ borderRadius: '12px' }} />
                                 <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {/* USERS MANAGEMENT TAB */}
             {activeTab === 'users' && (
               <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <div>
                       <h1 style={{ margin: 0 }}>Quản Trị Nhân Sự Cấp Cao</h1>
                       <span style={{ color: 'var(--text-muted)' }}>Điều phối Quyền lực Sinh, Sát, Tù, Khóa dành cho công dân.</span>
                     </div>
                     <div style={{ display: 'flex', gap: '12px', width: '320px' }}>
                        <div className="input-friendly" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--surface-opaque)' }}>
                           <Search size={16} color="var(--text-muted)" />
                           <input 
                             type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                             placeholder="Truy vấn Email / Tên..."
                             style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%' }}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="friendly-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--primary-bg)' }}>
                        <tr>
                          <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Định Danh Công Dân</th>
                          <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Thành Tích / Ngày Sinh</th>
                          <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold' }}>Hồ Sơ (Giao Dịch)</th>
                          <th style={{ padding: '20px 24px', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'right' }}>Quyền Trượng (Thao Tác)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => {
                          const stats = getUserStats(u.email);
                          return (
                          <tr key={idx} style={{ 
                             borderBottom: '1px solid var(--border-light)', 
                             background: u.isDeleted ? 'var(--surface-opaque)' : u.isLocked ? 'var(--warning-bg)' : u.isWarned ? 'var(--danger-bg)' : 'transparent',
                             opacity: u.isDeleted ? 0.6 : 1,
                             transition: 'all 0.2s'
                          }}>
                            {/* CỘT 1: AVATAR & INFO */}
                            <td style={{ padding: '20px 24px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ position: 'relative' }}>
                                    <img src={`https://ui-avatars.com/api/?name=${u.name.replace(' ','+')}&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff&rounded=true`} alt="Avatar" width="44" height="44" style={{ borderRadius: '50%' }} />
                                    {stats.hasIrregular && !u.isDeleted && <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></div>}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                     <span style={{ fontWeight: '800', fontSize: '15px', color: u.isDeleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: u.isDeleted ? 'line-through' : 'none' }}>{u.name}</span>
                                     <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.email}</span>
                                  </div>
                               </div>
                            </td>
                            {/* CỘT 2: TRẠNG THÁI */}
                            <td style={{ padding: '20px 24px' }}>
                               {u.role === 'admin' ? <span className="badge" style={{background: 'var(--primary)', color: 'white'}}>Giám Đốc Tối Cao</span> : 
                                u.isDeleted ? <span className="badge" style={{background: 'var(--text-muted)', color: 'white'}}>Đã Bị Trảm (Xóa)</span> :
                                u.isLocked ? <span className="badge warning">Tạm Giam</span> :
                                u.isWarned ? <span className="badge danger">Cờ Suy Thoái</span> :
                                <span className="badge success">Công Dân Tốt</span>}
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Tạo lúc: <b>{u.createdAt?.substring(0,10)}</b></div>
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Vào cuối: <b>{u.lastActive?.substring(0,10) || 'Unknown'}</b></div>
                            </td>
                            {/* CỘT 3: STATS */}
                            <td style={{ padding: '20px 24px' }}>
                               <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.txCount} Thu/Chi</span>
                               <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Dòng xuyển: <b>{stats.totalAmount.toLocaleString('vi-VN')} đ</b></div>
                               {stats.hasIrregular && !u.isDeleted && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', fontWeight: 'bold' }}>⚠️ Có giao dịch &gt; 100Tr</div>}
                            </td>
                            {/* CỘT 4: ACTIONS */}
                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                               <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                 <button onClick={() => handleResetPassword(u.email)} disabled={u.role === 'admin' || u.isDeleted} className="btn-secondary" style={{ padding: '6px', width: '32px', height: '32px', borderColor: 'var(--border-light)', color: 'var(--primary)' }} title="Tẩy Mật Khẩu (123456)">
                                    <RotateCcw size={14} />
                                 </button>
                                 <button onClick={() => handleToggleWarn(u.email, u.isWarned)} disabled={u.role === 'admin' || u.isDeleted} className="btn-secondary" style={{ padding: '6px', width: '32px', height: '32px', borderColor: 'var(--border-light)', color: u.isWarned ? 'var(--text-muted)' : 'var(--danger)' }} title={u.isWarned ? 'Gỡ Cờ' : 'Cắm Cờ Phạt'}>
                                    <AlertTriangle size={14} />
                                 </button>
                                 <button onClick={() => handleToggleLock(u.email, u.isLocked)} disabled={u.role === 'admin' || u.isDeleted} className="btn-error" style={{ padding: '6px', width: '32px', height: '32px', borderColor: 'var(--border-light)', background: u.isLocked ? 'var(--warning-bg)' : 'transparent', color: 'var(--warning)' }} title={u.isLocked ? "Ân Xá (Mở Khóa)" : "Bỏ Tù (Tạm Khóa)"}>
                                    {u.isLocked ? <Unlock size={14}/> : <Lock size={14} />}
                                 </button>
                                 <button onClick={() => handleToggleDelete(u.email, u.isDeleted)} disabled={u.role === 'admin'} className="btn-icon" style={{ padding: '6px', width: '32px', height: '32px', borderColor: 'transparent', background: u.isDeleted ? 'var(--success-bg)' : 'var(--danger-bg)', color: u.isDeleted ? 'var(--success)' : 'var(--danger)' }} title={u.isDeleted ? "Hồi Sinh" : "Tử Hình"}>
                                    {u.isDeleted ? <CheckCircle size={14} /> : <Trash2 size={14} />}
                                 </button>
                               </div>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
               </motion.div>
             )}

             {/* SYSTEM MANAGEMENT TAB */}
             {activeTab === 'system' && (
               <motion.div key="system" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ marginBottom: '32px' }}>
                     <h1 style={{ margin: 0 }}>Trung Tâm Hệ Thống</h1>
                     <span style={{ color: 'var(--text-muted)' }}>Cấu hình những thứ cốt lõi và truyền tin.</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                     {/* BROADCAST */}
                     <div className="friendly-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                           <Megaphone size={22} color="var(--primary)" />
                           <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Loa Phát Thanh Toàn Cầu</h3>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                           Điều khiển thiết bị của mọi công dân. Tin phát thanh này sẽ treo áp sát trên đỉnh App của tất cả người dùng khi họ Đăng nhập. (Ghi rỗng để tắt Loa).
                        </p>
                        <textarea 
                           className="input-friendly" 
                           placeholder="Ví dụ: Đêm nay 22h bảo trì Server nhé các cháu..."
                           rows={4}
                           value={broadcastMsg}
                           onChange={e => setBroadcastMsg(e.target.value)}
                           style={{ width: '100%', marginBottom: '16px', resize: 'vertical' }}
                        />
                        <button onClick={saveBroadcast} className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                           <AlertTriangle size={16} /> Bấm Nút Phát Loa
                        </button>
                     </div>

                     {/* CATEGORY MASTER */}
                     <div className="friendly-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                           <SettingsIcon size={22} color="var(--primary)" />
                           <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Hạng Mục Mặc Định (Chính Phủ)</h3>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                           Đây là các Nhãn dán thu/chi mà người dùng bắt buộc nhìn thấy và có thể chọn. Mọi tài khoản đều có chung tập Mặc Định này.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', flex: 1, alignContent: 'flex-start' }}>
                           {systemCategories.map((c, i) => (
                              <div key={i} className="badge" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {c} 
                                <span onClick={() => handleDelCat(c)} style={{ cursor: 'pointer', opacity: 0.5 }}>✕</span>
                              </div>
                           ))}
                           {systemCategories.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Trống trơn...</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                           <input type="text" className="input-friendly" placeholder="Nhập tên Danh mục..." value={newCat} onChange={e => setNewCat(e.target.value)} style={{ flex: 1 }} />
                           <button onClick={handleAddCat} className="btn-secondary">Ghim Mới (+)</button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             )}

             {/* LOGS TAB */}
             {activeTab === 'logs' && (
               <motion.div key="logs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div style={{ marginBottom: '24px' }}>
                     <h1 style={{ margin: 0 }}>Cơ Sở Dữ Liệu Camera (Log)</h1>
                     <span style={{ color: 'var(--text-muted)' }}>Audit Log ngầm ghi lại mọi hoạt động trong thành phố 24/7.</span>
                  </div>

                  <div className="friendly-card" style={{ padding: '0', overflow: 'hidden' }}>
                     <div style={{ padding: '16px 24px', background: 'var(--primary-bg)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>NHẬT KÝ ĐẦU GHI AI</span>
                         <button onClick={handleClearLogs} className="btn-secondary" style={{ padding: '8px 16px', color: 'var(--danger)', background: 'var(--danger-bg)', border: 'none' }}>
                           <Trash2 size={16} /> Format Ổ Cứng
                         </button>
                     </div>
                     <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                       <tbody>
                         {logs.map((log, idx) => (
                           <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                             <td style={{ padding: '18px 24px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>[{log.timestamp}]</td>
                             <td style={{ padding: '18px 24px', fontWeight: 'bold', color: 'var(--primary)', fontSize: '14px' }}>{log.user}</td>
                             <td style={{ padding: '18px 24px' }}>
                                <span className="badge" style={{ background: 'var(--surface-opaque)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                   {log.action}
                                </span>
                             </td>
                             <td style={{ padding: '18px 24px', color: 'var(--text-primary)', fontSize: '13.5px' }}>{log.details}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                     {logs.length === 0 && (
                        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                           <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                           Hệ thống Camera đang chong đèn vắng vẻ. Trạng thái ổ cứng: Trống.
                        </div>
                     )}
                  </div>
               </motion.div>
             )}
          </AnimatePresence>
       </main>
    </div>
  );
}
