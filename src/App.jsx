import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import { LayoutDashboard, Wallet, Target, PieChart, Receipt, Settings as SettingsIcon, LogOut, Moon, Sun, ShieldCheck, UserPlus, LogIn, ChevronRight, MailCheck, Lock, AlertTriangle } from 'lucide-react';

import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import AIChatbot from './components/AIChatbot';
import Reports from './components/Reports';
import Settings from './components/Settings';
import DebtManager from './components/DebtManager';
import AdminDashboard from './components/AdminDashboard';

import { saveData, loadData } from './services/StorageService';
import { logAction } from './services/AuditService';

export default function App() {
  // DB Người dùng
  const defaultUsers = [
    { email: 'admin@gmail.com', password: 'admin', name: 'Giám Đốc Hệ Thống', role: 'admin' },
    { email: 'minhduc@gmail.com', password: '123', name: 'Minh Đức', role: 'user' }
  ];
  const [usersDB, setUsersDB] = useState(() => loadData('users_db', defaultUsers));
  useEffect(() => { saveData('users_db', usersDB); }, [usersDB]);

  // Auth & Security State
  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState('login');
  
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  
  // Registration Data
  const [tempRegData, setTempRegData] = useState({ name: '', email: '', otp: '' });
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [emailNotification, setEmailNotification] = useState(null);

  // App State
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('VND'); 
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [monthlyBudget, setMonthlyBudget] = useState(() => Number(localStorage.getItem('budget_' + (user?.email || ''))) || 20000000);

  useEffect(() => {
    if (user) localStorage.setItem('budget_' + user.email, monthlyBudget);
  }, [monthlyBudget, user]);
  
  // Data State - Gán cho một User cụ thể
  const [allTransactions, setAllTransactions] = useState(() => loadData('tx_data', []));
  const [allGoals, setAllGoals] = useState(() => loadData('goals_data', []));
  const [allDebts, setAllDebts] = useState(() => loadData('debts_data', []));

  useEffect(() => { saveData('tx_data', allTransactions); }, [allTransactions]);
  useEffect(() => { saveData('goals_data', allGoals); }, [allGoals]);
  useEffect(() => { saveData('debts_data', allDebts); }, [allDebts]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Lockout countdown mechanism
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
       timer = setInterval(() => setLockoutTimer(p => p - 1), 1000);
    } else if (lockoutTimer === 0 && loginAttempts >= 3) {
       setLoginAttempts(0);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer, loginAttempts]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Idle Mechanism
  const timeoutRef = useRef(null);
  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        logAction(user.email, 'Bảo mật', 'Tự động khóa ứng dụng do bận');
        setUser(null);
        alert('Phiên đăng nhập đã tự động khóa để bảo mật dữ liệu riêng tư!');
      }, 10 * 60 * 1000); // 10 minutes
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, [user]);

  // ----- AUTH LOGIC -----
  const hashPwd = (p) => CryptoJS.SHA256(p).toString();

  const handleLogin = (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return; // Không cho click nếu đang khóa

    const email = e.target.email.value;
    const pwd = e.target.password.value;
    const hashed = hashPwd(pwd);
    
    // So khớp mã HASH hoặc Mật khẩu gốc (Dành cho tài khoản cũ chưa mã hoá)
    const account = usersDB.find(u => u.email === email && (u.password === pwd || u.password === hashed));
    
    if (account) {
       setUser({
         ...account,
         // Trả lại UI Avatars chuyên nghiệp với chữ cái
         avatar: `https://ui-avatars.com/api/?name=${account.name.replace(/ /g, '+')}&background=0d9488&color=fff&size=128&rounded=true`
       });
       setLoginAttempts(0);
       logAction(email, 'Đăng nhập', `Đăng nhập hệ thống bảo mật`);
       resetTimeout();
    } else {
       const fails = loginAttempts + 1;
       setLoginAttempts(fails);
       if (fails >= 3) {
          setLockoutTimer(30);
          logAction(email || 'Khách', 'Cảnh Báo Xâm Nhập', 'Nhập sai mật khẩu 3 lần. Kích hoạt khóa 30s.');
       }
    }
  };

  const handleRegStep1 = (e) => {
    e.preventDefault();
    if (!captchaChecked) return alert('Hãy đánh dấu xác nhận bảo mật máy chủ!');

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();

    if (usersDB.find(u => u.email === email)) return alert('Thật tiếc, Email này đã có người đăng ký rồi!');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setTempRegData({ ...tempRegData, name, email });
    setTempRegData({ ...tempRegData, name, email });
    setAuthMode('register_step2_otp');

    setTimeout(() => {
      setEmailNotification({ name, otp, email });
      setTimeout(() => setEmailNotification(null), 60000); // Tồn tại 60s
    }, 800);
  };

  const handleRegStep2 = (e) => {
    e.preventDefault();
    const inputOTP = e.target.otp.value;
    if (inputOTP === generatedOTP) {
        setAuthMode('register_step3_pwd');
    } else {
        alert('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  const handleRegStep3 = (e) => {
    e.preventDefault();
    const pwd = e.target.password.value;
    const rePwd = e.target.repassword.value;

    if (pwd.length < 6) return alert('Mật khẩu chưa đủ mạnh! Vui lòng đặt tối thiểu 6 ký tự để bảo vệ Két Sắt.');
    if (pwd !== rePwd) return alert('Hai mật khẩu không khớp nhau mất rồi!');
    
    // Kích hoạt Mã Thuật Toán SHA256 thay vì thô
    const securePwd = hashPwd(pwd);
    const newUser = { email: tempRegData.email, password: securePwd, name: tempRegData.name, role: 'user' };
    setUsersDB([...usersDB, newUser]);
    
    setUser({
      ...newUser,
      avatar: `https://ui-avatars.com/api/?name=${tempRegData.name.replace(/ /g, '+')}&background=0d9488&color=fff&size=128&rounded=true`
    });
    
    // Reset Data cache (đề phòng có dữ liệu session)
    setCaptchaChecked(false);
    logAction(tempRegData.email, 'Tạo tài khoản', `Xác minh thành công, mã hoá DB: ${tempRegData.name}`);
    alert(`Khởi tạo thành công! Chào ${tempRegData.name}. Mọi thứ đã đưa về 0đ an toàn.`);
  };

  const handleLogout = () => {
    if(user) logAction(user.email, 'Đăng xuất', 'Rời hệ thống');
    setUser(null);
    setAuthMode('login');
    setCaptchaChecked(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const updateUserProfile = (newName) => {
     // Hàm hỗ trợ đổi tên ở Setting
     const updatedUsers = usersDB.map(u => u.email === user.email ? { ...u, name: newName } : u);
     setUsersDB(updatedUsers);
     setUser({ 
       ...user, 
       name: newName, 
       avatar: `https://ui-avatars.com/api/?name=${newName.replace(/ /g, '+')}&background=0d9488&color=fff&size=128&rounded=true` 
     });
  };

  // --- RENDERING ROUTER ---
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="auth-bg"></div>
        
        {/* Email Popup */}
        <AnimatePresence>
          {emailNotification && (
            <motion.div 
               initial={{ opacity: 0, y: -50, scale: 0.9 }} 
               animate={{ opacity: 1, y: 20, scale: 1 }} 
               exit={{ opacity: 0, y: -50, scale: 0.9 }} 
               style={{ 
                  position: 'absolute', top: 0, right: '20px', zIndex: 9999, 
                  background: 'white', padding: '20px', borderRadius: '16px', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                  border: '1px solid var(--border-light)', display: 'flex', gap: '16px', maxWidth: '380px' 
               }}>
               <div style={{ background: '#ea4335', color: 'white', padding: '12px', borderRadius: '12px', height: 'fit-content' }}>
                  <MailCheck size={24} />
               </div>
               <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Hộp Thư Đến Định Danh</div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>Mã Kích Hoạt Két Sắt</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                    Chào <b>{emailNotification.name}</b>, mã bảo mật của bạn là: <br/>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '4px', display: 'block', margin: '8px 0' }}>{emailNotification.otp}</span>
                    Mã sẽ hết hạn sau 60s. Vui lòng không chia sẻ.
                  </div>
               </div>
               <button onClick={() => setEmailNotification(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} 
          className="friendly-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center', zIndex: 10 }}>
          
          <div style={{ background: 'var(--primary-bg)', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--primary)' }}>
            <ShieldCheck size={36} />
          </div>
          
          <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', color: 'var(--text-primary)' }}>Nền tảng Quản lý Tài chính</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
             {lockoutTimer > 0 
               ? `Tài khoản tạm khóa để bảo đảm an toàn.` 
               : authMode === 'login' ? 'Vui lòng đăng nhập để truy cập hệ thống quản lý.'
               : authMode === 'register_step1' ? 'Thiết lập tài khoản quản lý tài chính cá nhân mới.'
               : authMode === 'register_step2_otp' ? 'Nhập mã xác thực để hoàn tất quá trình định danh.'
               : 'Khởi tạo mật khẩu. Hệ thống sử dụng mã hoá bảo mật cao cấp.'}
          </p>
          
          <AnimatePresence mode="wait">
            
            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                {loginAttempts > 0 && lockoutTimer === 0 && (
                  <div style={{ color: 'var(--danger)', background: 'var(--danger-bg)', padding: '12px', borderRadius: '12px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', textAlign: 'left' }}>
                     <AlertTriangle size={16}/> Bạn đã nhập sai {loginAttempts}/3 lần cho phép!
                  </div>
                )}
                
                {lockoutTimer > 0 ? (
                   <div style={{ color: 'white', background: 'var(--danger)', padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                      🚫 KHÓA TRUY CẬP TRONG {lockoutTimer} GIÂY
                   </div>
                ) : (
                   <>
                     <input name="off_email" style={{display:'none'}} type="text"/>
                     <input name="email" type="email" required placeholder="Địa chỉ Email" className="input-friendly" autoComplete="new-email" />
                     <input name="password" type="password" required placeholder="••••••••" className="input-friendly" autoComplete="new-password" />
                     
                     <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', fontSize: '16px' }}>
                       Xác Thực <ChevronRight size={18} />
                     </button>
                   </>
                )}
                
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Chưa có tài khoản? <span onClick={() => { setAuthMode('register_step1'); setLoginAttempts(0); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Đăng ký ngay</span>
                </p>
              </motion.form>
            )}

            {/* REGISTER STEP 1 */}
            {authMode === 'register_step1' && (
              <motion.form key="reg1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <input name="fake_name" style={{display:'none'}} type="text"/>
                <input name="fake_email" style={{display:'none'}} type="email"/>
                
                <input name="name" type="text" required placeholder="Họ Tên Của Bạn (Tự gõ để chống Autofill)" className="input-friendly" autoComplete="new-password" />
                <input name="email" type="email" required placeholder="Email để Kích hoạt Bảo mật 2 Bước" className="input-friendly" autoComplete="new-password" />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-base)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                   <input type="checkbox" id="captcha" checked={captchaChecked} onChange={(e) => setCaptchaChecked(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
                   <label htmlFor="captcha" style={{ fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none', cursor: 'pointer' }}>Xác nhận quyền lưu trữ File Local (Không mã độc)</label>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  <MailCheck size={18} /> Xác Minh Email
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Đã có tài khoản? <span onClick={() => setAuthMode('login')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Đăng nhập</span>
                </p>
              </motion.form>
            )}

             {/* REGISTER STEP 2 */}
            {authMode === 'register_step2_otp' && (
              <motion.form key="reg2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <div style={{ padding: '12px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '12px', fontSize: '14px', marginBottom: '8px' }}>
                   Mã xác minh OTP vừa được gửi đến Email: <b>{tempRegData.email}</b>. 
                </div>
                <input name="otp" type="text" required placeholder="MÃ OTP 6 SỐ" maxLength={6} className="input-friendly" style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', fontWeight: 'bold' }} autoComplete="off" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  Xác Nhận OTP
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span onClick={() => setAuthMode('register_step1')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Hủy và quay lại</span>
                </p>
              </motion.form>
            )}

            {/* REGISTER STEP 3 */}
            {authMode === 'register_step3_pwd' && (
              <motion.form key="reg3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep3} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '12px', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', textAlign: 'left' }}>
                   Bảo mật lớp 2/2: Đã xác thực thành công. <br/>Vui lòng thiết lập mật khẩu bảo mật cho tài khoản của bạn.
                </div>
                <input name="password" type="password" required placeholder="Tạo mật khẩu (Tối thiểu 6 ký tự)" className="input-friendly" />
                <input name="repassword" type="password" required placeholder="Xác nhận lại mật khẩu" className="input-friendly" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px', background: 'var(--success)' }}>
                  <Lock size={18} /> Hoàn Tất Đăng Ký
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Nếu là Admin, màn hình chỉ hiện Admin Dashboard chuyên quản lý
  if (user.role === 'admin') {
    return <AdminDashboard usersDB={usersDB} setUsersDB={setUsersDB} onLogout={handleLogout} />;
  }

  // Lọc Data cho User
  const myTransactions = allTransactions.filter(t => t.owner === user.email);
  const myGoals = allGoals.filter(g => g.owner === user.email);
  const myDebts = allDebts.filter(d => d.owner === user.email);

  const handleAddTx = (tx) => {
    setAllTransactions([{ ...tx, owner: user.email }, ...allTransactions]);
  };
  const handleDeleteTx = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa giao dịch này không?")) {
      setAllTransactions(allTransactions.filter(t => t.id !== id));
    }
  };
  const handleAddGoal = (g) => {
    setAllGoals([...allGoals, { ...g, owner: user.email }]);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} onDeleteTx={handleDeleteTx} monthlyBudget={monthlyBudget} user={user} />;
      case 'reports': return <Reports transactions={myTransactions} currency={currency} onDeleteTx={handleDeleteTx} />;
      case 'debts': return <DebtManager currency={currency} debts={myDebts} allDebts={allDebts} setAllDebts={setAllDebts} user={user} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} currency={currency} setCurrency={setCurrency} updateUserProfile={updateUserProfile} monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget} />;
      default: return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} onDeleteTx={handleDeleteTx} monthlyBudget={monthlyBudget} user={user} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Trang Chủ', icon: <LayoutDashboard size={20} /> },
    { id: 'reports', label: 'Thống Kê', icon: <PieChart size={20} /> },
    { id: 'debts', label: 'Sổ Nợ', icon: <Receipt size={20} /> },
    { id: 'settings', label: 'Cài Đặt', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '14px', color: 'var(--primary)' }}>
            <Wallet size={26} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--primary)' }}>Smart KH</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '16px',
                background: activeTab === item.id ? 'var(--primary)' : 'transparent',
                color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
                border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                textAlign: 'left', width: '100%'
              }}
            >
              <span style={{ opacity: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="friendly-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', border: '1px solid var(--border-light)', boxShadow: 'none' }}>
          <img src={user.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ color: 'var(--success)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12}/> Đã Gắn Mã Hashing
            </div>
          </div>
          <button onClick={handleLogout} className="btn-icon" style={{ borderColor: 'var(--danger-bg)', color: 'var(--danger)', background: 'var(--danger-bg)' }} title="Khóa Cổng Ngay Lập Tức">
            <LogOut size={16} strokeWidth={3} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '24px 40px', background: 'var(--surface-opaque)',
          borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 40
        }}>
          <div>
             <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>
                {activeTab === 'dashboard' && `Tổng quan Tài chính, ${user.name}.`}
                {activeTab === 'reports' && 'Báo cáo Phân tích Chi tiêu'}
                {activeTab === 'debts' && 'Quản lý Công nợ & Khoản vay'}
                {activeTab === 'settings' && 'Cài đặt Hệ thống'}
             </h1>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                Giám sát và kiểm soát dòng tiền cá nhân chuyên nghiệp.
             </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <button onClick={toggleTheme} className="btn-icon" style={{ borderRadius: '14px', width: '44px', height: '44px' }} title="Tắt/Mở đèn (Đèn tối/sáng)">
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             {activeTab === 'dashboard' && (
               <>
                 <button onClick={() => setShowGoalForm(true)} className="btn-secondary">
                   <Target size={18} /> Thiết Lập Mục Tiêu
                 </button>
                 <button onClick={() => setShowTransactionForm(true)} className="btn-primary">
                   + Thêm Giao Dịch
                 </button>
               </>
             )}
          </div>
        </header>

        <div style={{ padding: '32px 40px', flex: 1 }}>
           <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.3 }}
               style={{ height: '100%' }}
             >
               {renderContent()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showTransactionForm && (
          <TransactionForm onClose={() => setShowTransactionForm(false)} onAdd={handleAddTx}/>
        )}
        {showGoalForm && (
          <GoalForm onClose={() => setShowGoalForm(false)} onAdd={handleAddGoal}/>
        )}
      </AnimatePresence>

      <AIChatbot transactions={myTransactions} />
    </div>
  );
}
