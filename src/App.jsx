import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Wallet, Target, PieChart, Receipt, Settings as SettingsIcon, LogOut, Moon, Sun, ShieldCheck, UserPlus, LogIn, ChevronRight, MailCheck, Lock } from 'lucide-react';

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

  // Auth State
  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register_step1' | 'register_step2_otp' | 'register_step3_pwd'
  
  // Registration Data
  const [tempRegData, setTempRegData] = useState({ name: '', email: '', otp: '' });
  const [generatedOTP, setGeneratedOTP] = useState('');

  // App State
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('VND'); 
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Data State - Gán cho một User cụ thể
  const [allTransactions, setAllTransactions] = useState(() => loadData('tx_data', []));
  const [allGoals, setAllGoals] = useState(() => loadData('goals_data', []));

  useEffect(() => { saveData('tx_data', allTransactions); }, [allTransactions]);
  useEffect(() => { saveData('goals_data', allGoals); }, [allGoals]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Idle Mechanism
  const timeoutRef = useRef(null);
  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        logAction(user.email, 'Bảo mật', 'Tự động khóa ứng dụng do bận');
        setUser(null);
        alert('Phiên đăng nhập đã hết hạn để bảo vệ dữ liệu của bạn!');
      }, 10 * 60 * 1000);
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

  // Handle Login flow
  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const pwd = e.target.password.value;
    
    const account = usersDB.find(u => u.email === email && u.password === pwd);
    
    if (account) {
       setUser({
         ...account,
         avatar: `https://ui-avatars.com/api/?name=${account.name.replace(' ','+')}&background=0d9488&color=fff&size=128&rounded=true`
       });
       logAction(email, 'Đăng nhập', `Đăng nhập thiết bị`);
       resetTimeout();
    } else {
       alert('Rất tiếc! Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại!');
    }
  };

  // Handle Registration Flow - Step 1: Info to OTP
  const handleRegStep1 = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;

    if (usersDB.find(u => u.email === email)) return alert('Thật tiếc, Email này đã có người đăng ký rồi. Hãy dùng email khác nhé!');

    // Tạo mã OTP 6 số giả lập
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setTempRegData({ ...tempRegData, name, email });
    setAuthMode('register_step2_otp');

    // Hiệu ứng gửi mail ảo
    setTimeout(() => {
      alert(`[HỆ THỐNG MÔ PHỎNG ĐÃ GỬI MAIL] \nXin chào ${name}, \nMã OTP bảo mật của bạn là: ${otp} \n\nVui lòng không chia sẻ mã này cho ai.`);
    }, 800);
  };

  // Handle Registration Flow - Step 2: Validate OTP
  const handleRegStep2 = (e) => {
    e.preventDefault();
    const inputOTP = e.target.otp.value;
    if (inputOTP === generatedOTP) {
        setAuthMode('register_step3_pwd');
    } else {
        alert('Mã OTP không chính xác. Bạn hãy kiểm tra lại hòm thư nhé!');
    }
  };

  // Handle Registration Flow - Step 3: Pwd & Create
  const handleRegStep3 = (e) => {
    e.preventDefault();
    const pwd = e.target.password.value;
    const rePwd = e.target.repassword.value;

    if (pwd !== rePwd) return alert('Ồ không, hai mật khẩu không khớp nhau mất rồi!');
    
    const newUser = { email: tempRegData.email, password: pwd, name: tempRegData.name, role: 'user' };
    setUsersDB([...usersDB, newUser]);
    
    // Đăng nhập luôn sau khi tạo
    setUser({
      ...newUser,
      avatar: `https://ui-avatars.com/api/?name=${tempRegData.name.replace(' ','+')}&background=0d9488&color=fff&size=128&rounded=true`
    });
    
    // KHÔNG tạo giao dịch mồi -> Trả về 0đ theo yêu cầu! Vĩnh viễn lưu cache cho account này.
    logAction(tempRegData.email, 'Tạo tài khoản', `Người dùng mới xác minh Mail thành công: ${tempRegData.name}`);
    alert(`Xác minh thành công! Chào ${tempRegData.name}. Số dư hiện tại là 0đ, bạn có thể tự nạp tiền và bắt đầu sử dụng nhé!`);
  };

  const handleLogout = () => {
    if(user) logAction(user.email, 'Đăng xuất', 'Rời hệ thống');
    setUser(null);
    setAuthMode('login');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // --- RENDERING ROUTER ---
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div className="auth-bg"></div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} 
          className="friendly-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center', zIndex: 10 }}>
          
          <div style={{ background: 'var(--primary-bg)', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--primary)' }}>
            <Wallet size={36} />
          </div>
          
          <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', color: 'var(--text-primary)' }}>Smart Expense</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
            {authMode === 'login' && 'Quản lý tiền bạc vui vẻ, thông minh và an tâm hơn mỗi ngày cùng cậu.'}
            {authMode === 'register_step1' && 'Bắt đầu hành trình tự do tài chính.'}
            {authMode === 'register_step2_otp' && 'Xác minh Email để bảo vệ dữ liệu cục bộ.'}
            {authMode === 'register_step3_pwd' && 'Tạo lớp khoá két sắt cuối cùng của cậu.'}
          </p>
          
          <AnimatePresence mode="wait">
            
            {/* MÀN LOGIN */}
            {authMode === 'login' && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input name="email" type="email" required placeholder="Email của bạn" className="input-friendly" defaultValue="minhduc@gmail.com" />
                <input name="password" type="password" required placeholder="Mật khẩu bí mật" className="input-friendly" defaultValue="123" />
                
                <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%', fontSize: '16px' }}>
                  Đăng Nhập <ChevronRight size={18} />
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cậu chưa có tài khoản? <span onClick={() => setAuthMode('register_step1')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Mở ví mới cực nhanh!</span>
                </p>
              </motion.form>
            )}

            {/* MÀN ĐĂNG KÝ 1: INFO */}
            {authMode === 'register_step1' && (
              <motion.form key="reg1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input name="name" type="text" required placeholder="Họ Tên (VD: Thanh Trúc)" className="input-friendly" />
                <input name="email" type="email" required placeholder="Gõ Email thật để nhận mã OTP" className="input-friendly" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  <MailCheck size={18} /> Gửi Mã Xác Minh
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Đã là thành viên? <span onClick={() => setAuthMode('login')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Đăng nhập thôi!</span>
                </p>
              </motion.form>
            )}

            {/* MÀN ĐĂNG KÝ 2: OTP */}
            {authMode === 'register_step2_otp' && (
              <motion.form key="reg2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '12px', fontSize: '14px', marginBottom: '8px' }}>
                   Hệ thống đã gửi hộp thư OTP đến email <b>{tempRegData.email}</b>. Vui lòng kiểm tra!
                </div>
                <input name="otp" type="text" required placeholder="Nhập 6 Số Mã OTP" maxLength={6} className="input-friendly" style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', fontWeight: 'bold' }} />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  Xác Thực OTP
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span onClick={() => handleRegStep1({preventDefault: ()=>{}, target:{name:{value: tempRegData.name}, email:{value: tempRegData.email}}})} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Gửi lại mã?</span>
                  {' '} | {' '}
                  <span onClick={() => setAuthMode('register_step1')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Đổi Email</span>
                </p>
              </motion.form>
            )}

            {/* MÀN ĐĂNG KÝ 3: PASSWORD */}
            {authMode === 'register_step3_pwd' && (
              <motion.form key="reg3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegStep3} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '12px', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
                   Xác thực danh tính công dân thành công. Tính năng Số dư 0đ độc quyền đã kích hoạt. Dữ liệu của bạn được tách rời hoàn toàn!
                </div>
                <input name="password" type="password" required placeholder="Tạo mật khẩu cho két sắt" className="input-friendly" />
                <input name="repassword" type="password" required placeholder="Nhập lại mật khẩu" className="input-friendly" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  <Lock size={18} /> Hoàn Tất & Khởi Tạo Két
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

  const handleAddTx = (tx) => {
    setAllTransactions([{ ...tx, owner: user.email }, ...allTransactions]);
  };
  const handleAddGoal = (g) => {
    setAllGoals([...allGoals, { ...g, owner: user.email }]);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} />;
      case 'reports': return <Reports transactions={myTransactions} currency={currency} />;
      case 'debts': return <DebtManager currency={currency} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} currency={currency} setCurrency={setCurrency} />;
      default: return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tạp Dề (Trang chủ)', icon: <LayoutDashboard size={20} /> },
    { id: 'reports', label: 'Thống Kê Thần Tốc', icon: <PieChart size={20} /> },
    { id: 'debts', label: 'Tình Bạn (Sổ nợ)', icon: <Receipt size={20} /> },
    { id: 'settings', label: 'Cài Đặt Của Tớ', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ background: 'var(--primary-bg)', padding: '10px', borderRadius: '14px', color: 'var(--primary)' }}>
            <Wallet size={26} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--primary)' }}>Smart App</span>
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
            <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '600' }}>Ví bảo mật độc quyền</div>
          </div>
          <button onClick={handleLogout} className="btn-icon" style={{ borderColor: 'var(--danger-bg)', color: 'var(--danger)', background: 'var(--danger-bg)' }} title="Đăng xuất">
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
                {activeTab === 'dashboard' && `Chào ngày mới năng suất, ${user.name}! 🌤`}
                {activeTab === 'reports' && 'Bạn đã chi tiêu thế nào nhỉ?'}
                {activeTab === 'debts' && 'Đòi nợ tinh tế, chia tiền vui vẻ'}
                {activeTab === 'settings' && 'Tùy chỉnh góc nhỏ của bạn'}
             </h1>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                Tớ ở đây để giúp cậu luôn rủng rỉnh tiền tiêu.
             </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <button onClick={toggleTheme} className="btn-icon" style={{ borderRadius: '14px', width: '44px', height: '44px' }} title="Tắt/Mở đèn (Đèn tối/sáng)">
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             {activeTab === 'dashboard' && (
               <>
                 <button onClick={() => setShowGoalForm(true)} className="btn-secondary">
                   <Target size={18} /> Cắm cờ Mục tiêu
                 </button>
                 <button onClick={() => setShowTransactionForm(true)} className="btn-primary">
                   + Ghi xài tiền
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
