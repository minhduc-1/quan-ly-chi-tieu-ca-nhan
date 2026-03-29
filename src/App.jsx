import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import { LayoutDashboard, Wallet, Target, PieChart, Receipt, Settings as SettingsIcon, LogOut, Moon, Sun, ShieldCheck, UserPlus, LogIn, ChevronRight, MailCheck, Lock, AlertTriangle, BookOpen, Users, Trash2, Bell } from 'lucide-react';

import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import AIChatbot from './components/AIChatbot';
import Reports from './components/Reports';
import Settings from './components/Settings';
import DebtManager from './components/DebtManager';
import AdminDashboard from './components/AdminDashboard';
import DailyJournal from './components/DailyJournal';
import GroupWallet from './components/GroupWallet';
import Trash from './components/Trash';

import { saveData, loadData } from './services/StorageService';
import { logAction } from './services/AuditService';

export default function App() {
  // DB Người dùng
  const defaultUsers = [
    { email: 'adminwed@gmail.com', password: 'admin@1119990', name: 'Giám Đốc Hệ Thống', role: 'admin' },
    { email: 'minhduc@gmail.com', password: '123', name: 'Minh Đức', role: 'user' }
  ];
  const [usersDB, setUsersDB] = useState(() => {
     let db = loadData('users_db', defaultUsers);
     // Lọc sạch admin cũ lỡ lưu trong local storage do các phiên bản đồ án trước
     db = db.filter(u => u.role !== 'admin');
     // Backfill createdAt cho tài khoản cũ để vẽ Biểu đồ Recharts
     const nowStr = new Date().toISOString();
     const admin = { email: 'adminwed@gmail.com', password: 'admin@1119990', name: 'Giám Đốc Hệ Thống', role: 'admin', createdAt: nowStr };
     db = db.map(u => u.createdAt ? u : { ...u, createdAt: nowStr });
     return [admin, ...db];
  });
  useEffect(() => { saveData('users_db', usersDB); }, [usersDB]);

  // Auth & Security State
  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState('login');
  
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  
  // Auth & Registration Data
  const [tempRegData, setTempRegData] = useState({ name: '', email: '', otp: '' });
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [emailNotification, setEmailNotification] = useState(null);
  const [pendingAdminAccount, setPendingAdminAccount] = useState(null);

  // App State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  useEffect(() => { setBroadcastMessage(loadData('system_broadcast', '')); }, [user]);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currency, setCurrency] = useState('VND'); 
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(() => Number(localStorage.getItem('budget_' + (user?.email || ''))) || 20000000);

  useEffect(() => {
    if (user) {
       localStorage.setItem('budget_' + user.email, monthlyBudget);
    }
  }, [monthlyBudget, user]);
  
  // Data State - Gán cho một User cụ thể
  const [allTransactions, setAllTransactions] = useState(() => loadData('tx_data', []));
  const [allGoals, setAllGoals] = useState(() => loadData('goals_data', []));
  const [allDebts, setAllDebts] = useState(() => loadData('debts_data', []));
  const [allJournals, setAllJournals] = useState(() => loadData('journals_data', []));
  const [allGroups, setAllGroups] = useState(() => loadData('groups_data', []));
  const [allGroupTx, setAllGroupTx] = useState(() => loadData('group_tx_data', []));
  const [trashData, setTrashData] = useState(() => loadData('trash_data', []));

  useEffect(() => { saveData('tx_data', allTransactions); }, [allTransactions]);
  useEffect(() => { saveData('goals_data', allGoals); }, [allGoals]);
  useEffect(() => { saveData('debts_data', allDebts); }, [allDebts]);
  useEffect(() => { saveData('journals_data', allJournals); }, [allJournals]);
  useEffect(() => { saveData('groups_data', allGroups); }, [allGroups]);
  useEffect(() => { saveData('group_tx_data', allGroupTx); }, [allGroupTx]);
  useEffect(() => { saveData('trash_data', trashData); }, [trashData]);
  
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
       if (account.role === 'admin') {
           // Bật cơ chế OTP 2-lớp cho tài khoản Admin
           const otp = Math.floor(100000 + Math.random() * 900000).toString();
           setGeneratedOTP(otp);
           setPendingAdminAccount(account);
           setAuthMode('admin_login_otp');
           setTimeout(() => {
              setEmailNotification({ name: account.name, otp, email: account.email });
              setTimeout(() => setEmailNotification(null), 60000); // Tồn tại 60s
           }, 800);
           return;
       }
       
       if (account.isDeleted) {
          return alert('❌ TỪ CHỐI TRUY CẬP\n\nTài khoản của bạn đã bị vô hiệu hóa bởi Quản Trị Hệ Thống. Vui lòng liên hệ bộ phận hỗ trợ kỹ thuật để biết thêm chi tiết.');
       }
       if (account.isLocked) {
          return alert('🔒 KẾT NỐI BỊ ĐÌNH CHỈ\n\nTài khoản hiện đang trong trạng thái tạm khóa. Bạn không được phép tiếp tục truy cập vào phân hệ này.');
       }

       if (account.isWarned) {
          alert("⚠️ THÔNG BÁO TỪ QUẢN TRỊ HỆ THỐNG\n\nTài khoản của bạn đã bị gắn cờ cảnh báo do phát hiện các phiên giao dịch hoặc hành vi có dấu hiệu bất thường.\nVui lòng tuân thủ quy tắc sử dụng. Sự tái phạm có thể dẫn đến vô hiệu hóa tài khoản vĩnh viễn.");
       }

       const nowStr = new Date().toLocaleString('vi-VN');
       setUsersDB(prev => prev.map(u => u.email === account.email ? { ...u, lastActive: nowStr } : u));
       
       setUser({
         ...account,
         lastActive: nowStr,
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

  const handleAdminOTP = (e) => {
     e.preventDefault();
     const inputOTP = e.target.otp.value;
     if (inputOTP === generatedOTP && pendingAdminAccount) {
         const nowStr = new Date().toLocaleString('vi-VN');
         setUsersDB(prev => prev.map(u => u.email === pendingAdminAccount.email ? { ...u, lastActive: nowStr } : u));
         
         setUser({
           ...pendingAdminAccount,
           lastActive: nowStr,
           avatar: `https://ui-avatars.com/api/?name=${pendingAdminAccount.name.replace(/ /g, '+')}&background=0d9488&color=fff&size=128&rounded=true`
         });
         setLoginAttempts(0);
         logAction(pendingAdminAccount.email, 'Đăng nhập Giám Đốc', `Sếp đã xác thực qua lớp bảo mật vệ tinh 2 lớp thành công.`);
         resetTimeout();
     } else {
         alert('Sai mã OTP bảo mật. Hãy lấy lại OTP qua hộp thư hệ thống ảo!');
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
    const newUser = { email: tempRegData.email, password: securePwd, name: tempRegData.name, role: 'user', createdAt: new Date().toISOString() };
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

  const handleForgotStep1 = (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    
    // Tìm kiếm tài khoản có tồn tại
    const account = usersDB.find(u => u.email === email);
    if (!account) return alert('Thật đáng tiếc, Email này chưa được đăng ký trong hệ thống!');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setTempRegData({ email, name: account.name }); // Tái sử dụng tempRegData để lưu email cần quên pass
    setAuthMode('forgot_step2_otp');

    // Chèn delay nhẹ tạo cảm giác xử lý gửi mail thực
    setTimeout(() => {
      setEmailNotification({ name: account.name, otp, email });
      setTimeout(() => setEmailNotification(null), 60000); // Popup sống 60s
    }, 800);
  };

  const handleForgotStep2 = (e) => {
    e.preventDefault();
    const inputOTP = e.target.otp.value;
    if (inputOTP === generatedOTP) {
        setAuthMode('forgot_step3_pwd');
    } else {
        alert('Mã Khôi phục (OTP) không chính xác. Vui lòng thử lại!');
    }
  };

  const handleForgotStep3 = (e) => {
    e.preventDefault();
    const pwd = e.target.password.value;
    const rePwd = e.target.repassword.value;

    if (pwd.length < 6) return alert('Cảnh báo bảo mật: Mật khẩu mới cần dài tối thiểu 6 ký tự để làm khó hacker.');
    if (pwd !== rePwd) return alert('Hai mật khẩu không khớp. Vui lòng đối chiếu lại.');
    
    // Băm bảo mật và update CSDL
    const securePwd = hashPwd(pwd);
    const updatedUsers = usersDB.map(u => 
       u.email === tempRegData.email ? { ...u, password: securePwd } : u
    );
    
    setUsersDB(updatedUsers);
    
    logAction(tempRegData.email, 'Khôi phục Mật Khẩu', `Mật khẩu đổi thành công với xác thực OTP.`);
    alert(`Quá trình Khôi phục hoàn tất! Chào mừng ${tempRegData.name} quay lại. Vui lòng đăng nhập.`);
    
    setAuthMode('login'); // Yêu cầu người dùng tự đăng nhập lại cho an toàn tuyệt đối
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
               : authMode === 'admin_login_otp' ? 'Hàng rào bảo mật cấp 2 dành cho phiên đăng nhập linh hoạt của Giám Đốc Hệ Thống.'
               : authMode === 'register_step1' ? 'Thiết lập tài khoản quản lý tài chính cá nhân mới.'
               : authMode === 'register_step2_otp' ? 'Nhập mã xác thực để hoàn tất quá trình định danh.'
               : authMode === 'register_step3_pwd' ? 'Khởi tạo mật khẩu. Hệ thống sử dụng mã hoá bảo mật cao cấp.'
               : authMode === 'forgot_step1' ? 'Nhập Email của bạn để lấy lại mật khẩu Két Sắt.'
               : authMode === 'forgot_step2_otp' ? 'Xác thực mã bảo mật khôi phục gửi đến Email của bạn.'
               : 'Thiết lập Mật khẩu mới an toàn.'}
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
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <div>
                    Chưa có tài khoản? <span onClick={() => { setAuthMode('register_step1'); setLoginAttempts(0); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Đăng ký ngay</span>
                  </div>
                  <div>
                    Quên khóa mở két? <span onClick={() => { setAuthMode('forgot_step1'); setLoginAttempts(0); }} style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Khôi phục mật khẩu</span>
                  </div>
                </div>
              </motion.form>
            )}

            {/* ADMIN OTP LOGIN */}
            {authMode === 'admin_login_otp' && (
              <motion.form key="admin_otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleAdminOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <div style={{ padding: '14px', background: 'var(--primary-bg)', color: 'var(--primary)', borderRadius: '12px', fontSize: '13.5px', marginBottom: '8px', lineHeight: '1.5' }}>
                   Chào sếp! Có vẻ như ngài đang cố đăng nhập từ máy trạm khác. Để kiểm soát an toàn, một lớp mã OTP phòng chống nội gián đã gửi về màn hình chính (popup nhỏ góc trên).
                </div>
                <input name="otp" type="text" required placeholder="MÃ CAO CẤP OTP" maxLength={6} className="input-friendly" style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', fontWeight: 'bold' }} autoComplete="off" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  <ShieldCheck size={18} /> Mở Rèm Quyền Giám Đốc
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span onClick={() => { setAuthMode('login'); setPendingAdminAccount(null); }} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Quay lại Màn đăng nhập cơ bản</span>
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

            {/* FORGOT STEP 1 */}
            {authMode === 'forgot_step1' && (
              <motion.form key="forgot1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleForgotStep1} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <input name="email" type="email" required placeholder="Nhập Email để nhận Mã Khôi Phục" className="input-friendly" />
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  <MailCheck size={18} /> Gửi Mã Khôi Phục
                </button>
                <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Mọi thứ ổn rồi? <span onClick={() => setAuthMode('login')} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Quay lại Đăng nhập</span>
                </div>
              </motion.form>
            )}

             {/* FORGOT STEP 2 */}
            {authMode === 'forgot_step2_otp' && (
              <motion.form key="forgot2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleForgotStep2} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <div style={{ padding: '12px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '12px', fontSize: '14px', marginBottom: '8px' }}>
                   Mã khôi phục OTP vừa được gửi đến Email: <b>{tempRegData.email}</b>. 
                </div>
                <input name="otp" type="text" required placeholder="MÃ OTP 6 SỐ" maxLength={6} className="input-friendly" style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', fontWeight: 'bold' }} autoComplete="off" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px' }}>
                  Xác Nhận OTP
                </button>
                <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span onClick={() => setAuthMode('forgot_step1')} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Hủy Khôi Phục</span>
                </p>
              </motion.form>
            )}

            {/* FORGOT STEP 3 */}
            {authMode === 'forgot_step3_pwd' && (
              <motion.form key="forgot3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleForgotStep3} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
                <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '12px', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold', textAlign: 'left' }}>
                   Xác thực quyền sở hữu thành công. Vui lòng nhập Mật khẩu mới thay cho mật khẩu cũ.
                </div>
                <input name="password" type="password" required placeholder="Nhập Mật khẩu mới (Tối thiểu 6 ký tự)" className="input-friendly" />
                <input name="repassword" type="password" required placeholder="Xác nhận lại Mật khẩu" className="input-friendly" />
                
                <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '16px', background: 'var(--success)' }}>
                  <Lock size={18} /> Đổi Mật Khẩu
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
    return <AdminDashboard usersDB={usersDB} setUsersDB={setUsersDB} onLogout={handleLogout} allTransactions={allTransactions} />;
  }

  // Lọc Data cho User
  const myTransactions = allTransactions.filter(t => t.owner === user.email);
  const myGoals = allGoals.filter(g => g.owner === user.email);
  const myDebts = allDebts.filter(d => d.owner === user.email);

  const handleAddTx = (tx) => {
    // Luôn bọc thời gian chuẩn xác
    const finalTx = { ...tx, owner: user.email, timestamp: new Date().getTime() };
    setAllTransactions(prev => [finalTx, ...prev]);
  };
  const handleDeleteTx = (id) => {
    if (window.confirm("CẢNH BÁO: Giao dịch này sẽ bị xóa khỏi Báo cáo và chuyển vào Thùng Rác. Tiếp tục?")) {
      const deletedItem = allTransactions.find(t => t.id === id);
      if (deletedItem) {
         setTrashData(prev => [{ ...deletedItem, deletedAt: new Date().getTime(), sourceType: 'CÁ_NHÂN' }, ...prev]);
         setAllTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };
  const handleAddGoal = (g) => {
    setAllGoals(prev => [...prev, { ...g, owner: user.email }]);
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm("BẠN CÓ CHẮC CHẮN MỐI TÌNH NÀY SẼ KẾT THÚC?\nMục tiêu này sẽ bị xóa bỏ vĩnh viễn không thể khôi phục.")) {
        setAllGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const moveToTrash = (item, type = 'KHÁC') => {
     setTrashData(prev => [{ ...item, deletedAt: new Date().getTime(), sourceType: type }, ...prev]);
  };

  const handleRestoreTrash = (id) => {
     const item = trashData.find(t => t.id === id);
     if (!item) return;

     if (item.sourceType === 'CÁ_NHÂN') {
        setAllTransactions(prev => [item, ...prev]);
     } else if (item.sourceType === 'QUỸ_NHÓM') {
        setAllGroupTx(prev => [item, ...prev]);
     } else if (item.sourceType === 'HÓA_ĐƠN') {
        // Hóa đơn được khôi phục sẽ phát tín hiệu ra event cục bộ vì state của BillReminder độc lập
        window.dispatchEvent(new CustomEvent('RESTORE_BILL', { detail: item }));
     }
     
     setTrashData(prev => prev.filter(t => t.id !== id));
     alert('Phục hồi dữ liệu thành công!');
  };

  const handleEmptyTrash = () => {
     if (window.confirm("BẢO MẬT: Mọi rác thải sẽ bị nung chảy vĩnh viễn không thể khôi phục. Xác nhận?")) {
        setTrashData(prev => prev.filter(t => t.owner !== user.email));
     }
  };

  const handleResetAccountData = () => {
     // Lọc và giữ lại data không phải của user cần xóa
     setAllTransactions(prev => prev.filter(t => t.owner !== user.email));
     setAllGoals(prev => prev.filter(g => g.owner !== user.email));
     setAllDebts(prev => prev.filter(d => d.owner !== user.email));
     setAllJournals(prev => prev.filter(j => j.owner !== user.email));
     setTrashData(prev => prev.filter(t => t.owner !== user.email));
     
     // Không xóa Group và GroupTx vì nó thuộc về nhiều người
     alert('Khởi tạo lại dữ liệu thành công! Tài khoản của bạn đã trở về trạng thái nguyên sơ 0đ.');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} onDeleteTx={handleDeleteTx} onDeleteGoal={handleDeleteGoal} monthlyBudget={monthlyBudget} user={user} moveToTrash={moveToTrash} />;
      case 'journal': return <DailyJournal user={user} currency={currency} allJournals={allJournals} setAllJournals={setAllJournals} handleAddTx={handleAddTx} />;
      case 'group': return <GroupWallet user={user} currency={currency} allGroups={allGroups} setAllGroups={setAllGroups} allGroupTx={allGroupTx} setAllGroupTx={setAllGroupTx} moveToTrash={moveToTrash} />;
      case 'reports': return <Reports transactions={myTransactions} currency={currency} onDeleteTx={handleDeleteTx} />;
      case 'debts': return <DebtManager currency={currency} debts={myDebts} allDebts={allDebts} setAllDebts={setAllDebts} user={user} />;
      case 'settings': return <Settings user={user} onLogout={handleLogout} currency={currency} setCurrency={setCurrency} updateUserProfile={updateUserProfile} monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget} onResetAccountData={handleResetAccountData} />;
      case 'trash': return <Trash user={user} currency={currency} trashData={trashData} setTrashData={setTrashData} restoreItem={handleRestoreTrash} emptyTrash={handleEmptyTrash} />;
      default: return <Dashboard transactions={myTransactions} goals={myGoals} currency={currency} onDeleteTx={handleDeleteTx} onDeleteGoal={handleDeleteGoal} monthlyBudget={monthlyBudget} user={user} moveToTrash={moveToTrash} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Trang Chủ', icon: <LayoutDashboard size={20} /> },
    { id: 'journal', label: 'Sổ Nhật Ký', icon: <BookOpen size={20} /> },
    { id: 'group', label: 'Quỹ Nhóm', icon: <Users size={20} /> },
    { id: 'reports', label: 'Thống Kê', icon: <PieChart size={20} /> },
    { id: 'debts', label: 'Sổ Nợ', icon: <Receipt size={20} /> },
    { id: 'settings', label: 'Cài Đặt', icon: <SettingsIcon size={20} /> },
    { id: 'trash', label: 'Thùng Rác', icon: <Trash2 size={20} /> },
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
             
             <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="btn-icon" style={{ borderRadius: '14px', width: '44px', height: '44px', borderColor: broadcastMessage ? 'var(--danger)' : '' }} title="Thông báo hệ thống">
                  <Bell size={20} color={broadcastMessage ? 'var(--danger)' : 'currentColor'} />
                </button>
                {broadcastMessage && (
                   <span style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--surface-opaque)' }}></span>
                )}
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '360px', background: 'var(--surface-opaque)', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden' }}
                    >
                      <div style={{ padding: '16px', background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                         <span>Hộp Thư Hệ Thống</span>
                         <span style={{ fontSize: '13px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{broadcastMessage ? '1' : '0'} mới</span>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                         {broadcastMessage ? (
                           <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', background: 'var(--danger-bg)' }}>
                              <div style={{ color: 'var(--danger)', background: 'white', padding: '8px', borderRadius: '50%', height: 'fit-content' }}><AlertTriangle size={18}/></div>
                              <div>
                                 <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--danger)' }}>BÁO ĐỘNG TỪ GIÁM ĐỐC</strong>
                                 <p style={{ fontSize: '13.5px', color: 'var(--danger)', margin: 0, opacity: 0.9 }}>{broadcastMessage}</p>
                              </div>
                           </div>
                         ) : (
                           <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                              Bạn không có thông báo mới nào.
                           </div>
                         )}
                         <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                            <div style={{ color: 'var(--primary)', background: 'var(--primary-bg)', padding: '8px', borderRadius: '50%', height: 'fit-content' }}><ShieldCheck size={18}/></div>
                            <div>
                               <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Bảo mật an toàn</strong>
                               <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>Hệ thống đang được mã hóa đầu cuối phân đoạn dữ liệu cục bộ.</p>
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

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

      <AIChatbot transactions={myTransactions} currency={currency} />
    </div>
  );
}
