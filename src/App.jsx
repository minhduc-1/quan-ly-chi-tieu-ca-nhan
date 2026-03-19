import { useState, useEffect, useRef } from 'react';
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

// --- SVG Icons ---
const IconDashboard = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
const IconExpense = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 4h6m-3-4v8m-7 5h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const IconIncome = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>;
const IconGoal = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const IconDebt = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const IconChart = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>;
const IconSettings = () => <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;

function App() {
  const [user, setUser] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('VND'); 
  
  const defaultTx = [
    { id: '1', date: '24/04/2022', category: 'Siêu Thị', amount: -500000, note: 'Mua sắm đồ ăn' },
    { id: '2', date: '22/04/2022', category: 'Tiền Điện', amount: -1200000, note: 'Thanh toán hóa đơn' },
    { id: '3', date: '20/04/2022', category: 'Xăng Xe', amount: -300000, note: 'Đổ xăng' },
    { id: '4', date: '18/04/2022', category: 'Lương', amount: 15000000, note: 'Lương tháng 4' }
  ];
  const [transactions, setTransactions] = useState(() => loadData('tx_data', defaultTx));

  const defaultGoals = [
    { id: '1', name: 'Du Lịch Đà Nẵng', target: 30000000, current: 10000000, percent: 30 },
    { id: '2', name: 'Quỹ Mua Xe', target: 110000000, current: 45000000, percent: 45 },
    { id: '3', name: 'Quỹ Khẩn Cấp', target: 50000000, current: 35000000, percent: 70 }
  ];
  const [goals, setGoals] = useState(() => loadData('goals_data', defaultGoals));

  // Sync to secure storage
  useEffect(() => { saveData('tx_data', transactions); }, [transactions]);
  useEffect(() => { saveData('goals_data', goals); }, [goals]);

  // Idle Logout Mechanism
  const timeoutRef = useRef(null);
  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user || isAdmin) {
      timeoutRef.current = setTimeout(() => {
        logAction(user?.email || 'admin@gmail.com', 'Cảnh báo/Hệ thống', 'Tự động đăng xuất do hệ thống đóng băng 5 phút');
        handleLogout();
        alert('Phiên làm việc đã hết hạn do không hoạt động để bảo mật.');
      }, 5 * 60 * 1000); // 5 phút
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, [user, isAdmin]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) {
      alert(`Thiết bị đang bị khoá bảo mật. Vui lòng đợi ${Math.ceil((lockedUntil - Date.now())/1000)} giây để thử lại.`);
      return;
    }

    const email = e.target.email.value;
    const pwd = e.target.password.value;
    
    if (pwd !== '123456' && pwd !== 'admin') {
       const fails = failedAttempts + 1;
       setFailedAttempts(fails);
       logAction(email, 'Đăng nhập sai', `Sai mật khẩu lần ${fails}`);
       
       if (fails >= 3) {
          setLockedUntil(Date.now() + 30000); // Lock 30s
          logAction(email, 'Cảnh báo/Hệ thống', 'Tạm khóa thiết bị 30s do đăng nhập sai 3 lần');
          alert('Nhập sai 3 lần! Tạm khoá đăng nhập 30 giây để bảo vệ tài khoản.');
       } else {
          alert('Sai mật khẩu! (Gợi ý: 123456 hoặc "admin" cho quyền root)');
       }
       return;
    }
    
    setFailedAttempts(0);
    setPendingEmail(email);
    setShowOTP(true);
    logAction(email, 'Hệ thống Auth', 'Yêu cầu mã 2FA OTP qua giả lập điện thoại');
  };

  const handleOTPVerify = (e) => {
    e.preventDefault();
    const otp = e.target.otp.value;
    if (otp !== '888888') {
       alert('Sai mã OTP! (Gợi ý: 888888)');
       return;
    }
    
    setShowOTP(false);
    if (pendingEmail === 'admin@gmail.com') {
      setIsAdmin(true);
      logAction('admin@gmail.com', 'Đăng nhập Cấp cao', 'Đăng nhập thành công vào Màn hình Admin Giám đốc');
    } else {
      setUser({
        email: pendingEmail,
        name: pendingEmail.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${pendingEmail.split('@')[0]}&background=3498db&color=fff&size=128`
      });
      logAction(pendingEmail, 'Đăng nhập', 'Đăng nhập thành công vào Hệ thống cá nhân');
    }
    resetTimeout();
  };

  const handleLogout = () => {
    if(user || isAdmin) logAction(user?.email || 'admin@gmail.com', 'Đăng xuất', 'Chủ động Đăng xuất khỏi hệ thống');
    setUser(null);
    setIsAdmin(false);
    setPendingEmail('');
    document.documentElement.setAttribute('data-theme', 'light');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleAddTransaction = (newTx) => {
    const mappedTx = {
      id: newTx.id,
      date: new Date(newTx.date).toLocaleDateString('vi-VN'),
      category: newTx.category,
      amount: newTx.amount,
      note: newTx.note
    };
    setTransactions(prev => [mappedTx, ...prev]);
    logAction(user?.email, 'Giao dịch mới', `Ghi nhận giao dịch ${mappedTx.amount} đ vào nhóm ${mappedTx.category}`);
  };

  const handleAddGoal = (newGoal) => {
    setGoals(prev => [...prev, newGoal]);
    logAction(user?.email, 'Thêm thẻ Mục tiêu', `Mục tiêu mới: ${newGoal.name}`);
  };

  // --- RENDERING ROUTER ---

  if (!user && !isAdmin) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ marginBottom: '10px', color: 'var(--text-main)', fontSize: '1.5rem' }}>Bảo mật Doanh nghiệp</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.9rem' }}>Dữ liệu của bạn được mã hoá chuẩn AES cao cấp nhất</p>
          
          {!showOTP ? (
             <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <input 
                 name="email" type="email" required 
                 placeholder="Nhập địa chỉ Email (VD: admin@gmail.com)" 
                 className="input-field"
                 style={{ fontSize: '1rem', padding: '12px' }} 
               />
               <input 
                 name="password" type="password" required 
                 placeholder="Mật khẩu (123456 hoặc admin)" 
                 className="input-field"
                 style={{ fontSize: '1rem', padding: '12px' }} 
               />
               <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1rem' }}>
                 Xác Minh Thông Tin
               </button>
             </form>
          ) : (
             <form onSubmit={handleOTPVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.3s' }}>
                <div style={{ padding: '15px', background: 'rgba(52, 152, 219, 0.1)', color: 'var(--accent-blue)', borderRadius: '8px', fontSize: '0.9rem' }}>
                   Mã OTP 6 số đã được gửi tới thiết bị liên kết của <strong>{pendingEmail}</strong>.
                </div>
                <input 
                 name="otp" type="text" maxLength="6" required 
                 placeholder="Nhập mã OTP (Mặc định: 888888)" 
                 className="input-field"
                 style={{ fontSize: '1rem', padding: '12px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }} 
               />
               <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1rem', background: 'var(--accent-green)' }}>
                 Hoàn Tất Đăng Nhập Đa Tầng (2FA)
               </button>
               <button type="button" onClick={() => setShowOTP(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
                 Quay lại bước trước
               </button>
             </form>
          )}
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={transactions} goals={goals} currency={currency} />;
      case 'reports': return <Reports transactions={transactions} currency={currency} />;
      case 'debts': return <DebtManager currency={currency} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} currency={currency} setCurrency={setCurrency} />;
      default: return <Dashboard transactions={transactions} goals={goals} currency={currency} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Professional */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ background: '#3498db', padding: '6px', borderRadius: '4px', display: 'flex' }}><IconDashboard /></div>
          <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>SmartFinance</span>
        </div>
        <ul className="sidebar-menu">
           <li className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><IconDashboard /> Tổng Quan</li>
           <li className="sidebar-item" onClick={() => setShowTransactionForm(true)}><IconExpense /> Quản Lý Chi Tiêu</li>
           <li className="sidebar-item" onClick={() => setShowGoalForm(true)}><IconGoal /> Mục Tiêu Tiết Kiệm</li>
           <li className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><IconChart /> Phân Tích & Báo Cáo</li>
           <li className={`sidebar-item ${activeTab === 'debts' ? 'active' : ''}`} onClick={() => setActiveTab('debts')}><IconDebt /> Quản Lý Nợ</li>
           <li className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><IconSettings /> Cài Đặt</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <nav className="topbar-menu">
            <div className={`topbar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Trang Chủ</div>
            <div className={`topbar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Thống Kê</div>
            <div className={`topbar-item ${activeTab === 'debts' ? 'active' : ''}`} onClick={() => setActiveTab('debts')}>Sổ Nợ</div>
            <div className={`topbar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Cài Đặt</div>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <div onClick={() => setActiveTab('settings')} style={{ background: 'transparent', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
               <img src={user.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
               <span>{user.name} ▼</span>
             </div>
          </div>
        </header>

        <div className="page-content animate-fade-in">
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
             <div>
               <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '5px', transition: 'color 0.3s' }}>
                 {activeTab === 'dashboard' && 'Quản Lý Chi Tiêu Thu Nhập Tự Động'}
                 {activeTab === 'reports' && 'Phân Tích Dữ Liệu Chuyên Sâu'}
                 {activeTab === 'debts' && 'Kiểm Soát Nợ Cá Nhân'}
                 {activeTab === 'settings' && 'Mã Hóa & Tuỳ Chọn Hệ Thống'}
               </h1>
               <p style={{ color: 'var(--text-muted)' }}>Mừng bạn trở lại, <strong>{user.name}</strong>!</p>
             </div>
             
             {activeTab === 'dashboard' && (
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => setShowGoalForm(true)} className="btn-primary" style={{ background: 'var(--bg-topbar)', color: 'var(--text-light)' }}>+ Thẻ Mục tiêu</button>
                 <button onClick={() => setShowTransactionForm(true)} className="btn-primary">+ Thêm Giao Dịch</button>
               </div>
             )}
          </div>
          {renderContent()}
        </div>
      </main>

      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} onAdd={handleAddTransaction}/>
      )}

      {showGoalForm && (
        <GoalForm onClose={() => setShowGoalForm(false)} onAdd={handleAddGoal}/>
      )}

      <AIChatbot transactions={transactions} />
    </div>
  );
}

export default App;
