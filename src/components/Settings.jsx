import { useState } from 'react';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { saveData, loadData } from '../services/StorageService';
import { logAction } from '../services/AuditService';
import { DownloadCloud, UploadCloud, Coins, ShieldAlert, User, Mail, Database, LogOut, Flame, Edit3, Check, X } from 'lucide-react';

export default function Settings({ user, onLogout, currency, setCurrency, updateUserProfile }) {
  const [msg, setMsg] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);

  const exportCSV = () => {
    const tx = loadData('tx_data', []);
    if(tx.length === 0) return alert('Không có dữ liệu để xuất!');
    const csv = Papa.unparse(tx);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `smartexpense_backup_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    logAction(user?.email, 'Export CSV', 'Người dùng tải Backup Dữ liệu Giao dịch xuống máy');
  };

  const importCSV = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        saveData('tx_data', results.data);
        logAction(user?.email, 'Import CSV', `Người dùng nạp ${results.data.length} dòng dữ liệu từ CSV`);
        setMsg('Nhập bộ nhớ thành công! Xin hãy làm mới (F5) trang web.');
      }
    });
  };

  const exportJSON = () => {
    const backup = {
      transactions: loadData('tx_data', []),
      goals: loadData('goals_data', []),
      debts: loadData('debts_data', []),
      audit_logs: loadData('audit_logs', [])
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smart_expense_full_backup.json';
    link.click();
    logAction(user?.email, 'Export JSON Full', 'Tạo điểm ảnh hệ thống JSON (Full Dump)');
  };

  const handleHardReset = () => {
    if(window.confirm('CẢNH BÁO BẢO MẬT: Việc này sẽ đưa tất cả số liệu, giao dịch, số dư, công nợ... về 0 ĐỒNG. Nó không thể hoàn tác. Bạn chắc chắn phải ấn định việc này?')) {
        saveData('tx_data', []);
        saveData('goals_data', []);
        saveData('debts_data', []);
        alert('Tất cả dữ liệu đã được giải phóng về 0. Hãy bắt đầu hành trang mới với bảo mật cấp cao.');
        onLogout();
        window.location.reload();
    }
  };

  const saveName = () => {
      if (!editNameValue.trim()) return alert("Tên hiển thị không được để trống!");
      if (updateUserProfile) {
          updateUserProfile(editNameValue.trim());
      }
      setIsEditingName(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Hồ Sơ Cá Nhân */}
      <section>
         <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
            <User size={20} color="var(--primary)" /> Định Danh Hồ Sơ / Profile
         </h2>
         <div className="friendly-card" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img src={user.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '24px', boxShadow: 'var(--shadow-md)' }} />
            <div style={{ flex: 1, minWidth: '200px' }}>
               <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold' }}>
                     HIỂN THỊ CÔNG KHAI
                     {!isEditingName && (
                        <button onClick={() => setIsEditingName(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                           <Edit3 size={12} /> Đổi Tên
                        </button>
                     )}
                  </label>
                  
                  {isEditingName ? (
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                           type="text" 
                           value={editNameValue} 
                           onChange={(e) => setEditNameValue(e.target.value)} 
                           className="input-friendly" 
                           style={{ flex: 1, padding: '10px 16px', margin: 0 }}
                           autoFocus
                           onKeyDown={(e) => e.key === 'Enter' && saveName()}
                        />
                        <button onClick={saveName} className="btn-primary" style={{ padding: '10px 16px' }}><Check size={16}/></button>
                        <button onClick={() => { setIsEditingName(false); setEditNameValue(user.name); }} className="btn-secondary" style={{ padding: '10px 16px', background: 'var(--surface-opaque)' }}><X size={16} color="var(--danger)"/></button>
                     </div>
                  ) : (
                     <div style={{ padding: '12px 16px', background: 'var(--surface-base)', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {user.name}
                     </div>
                  )}
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold' }}>THƯ TIỆN ĐIỆN TỬ / EMAIL CỐ ĐỊNH</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--surface-base)', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '15px', color: 'var(--text-muted)' }}>
                     <Mail size={16} /> {user.email} 
                     <span className="badge success" style={{ marginLeft: 'auto', fontSize: '12px' }}>Gắn Chặt</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
         {/* Preferences */}
         <section>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
               <Coins size={20} color="var(--warning)" /> Tùy Chọn Hiển Thị Tiền Tệ
            </h2>
            <div className="friendly-card" style={{ padding: '24px', height: 'calc(100% - 40px)' }}>
               <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>
                  Định Dạng Tiền Tệ Quốc Tế
               </label>
               <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Thay đổi biểu tượng ngoại tệ cho toàn bộ hệ thống (Smart Expense V5).</p>
               
               <select 
                 value={currency} 
                 onChange={(e) => {
                    setCurrency(e.target.value);
                    logAction(user?.email, 'Đổi Tiền tệ', `Chuyển sang ${e.target.value}`);
                 }} 
                 className="input-friendly"
                 style={{ width: '100%', appearance: 'none', background: 'var(--surface-base)', fontSize: '15px', padding: '14px', marginBottom: '24px' }}
               >
                 <option value="VND">Tiền Việt (VNĐ)</option>
                 <option value="USD">Dollar Mỹ (USD $)</option>
                 <option value="EUR">Euro Châu Âu (EUR €)</option>
                 <option value="JPY">Yên Nhật (JPY ¥)</option>
               </select>

               <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>
                  Hạn Mức Ngân Sách Tháng
               </label>
               <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Đặt giới hạn cảnh báo khi dòng tiền ra vượt quá mốc này.</p>
               
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                 <input 
                    type="number"
                    className="input-friendly"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    style={{ flex: 1, padding: '14px', fontSize: '15px', margin: 0 }}
                    placeholder="VD: 20000000"
                 />
               </div>
            </div>
         </section>

         {/* Data Management */}
         <section>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
               <Database size={20} color="var(--primary)" /> Quản Lý Dữ Liệu
            </h2>
            <div className="friendly-card" style={{ padding: '24px', height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Smart Expense mã hóa dữ liệu 100% tại thiết bị của bạn.</p>
               
               <button onClick={exportCSV} className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                 <DownloadCloud size={18} /> Kết Xuất CSV
               </button>
               
               <button onClick={exportJSON} className="btn-primary" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                 <DownloadCloud size={18} /> Sao Lưu JSON An Toàn
               </button>

               <div style={{ position: 'relative', marginTop: '8px', paddingTop: '16px', borderTop: '1px dashed var(--border-light)' }}>
                 <label className="btn-secondary" style={{ cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}>
                   <UploadCloud size={18} /> Nhập Dữ Liệu Khôi Phục
                   <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
                 </label>
               </div>
               {msg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--success)', fontSize: '13px', textAlign: 'center', margin: 0, fontWeight: 'bold' }}>{msg}</motion.p>}
            </div>
         </section>
      </div>
      
      {/* Danger Zone */}
      <section>
         <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--danger)' }}>
            <ShieldAlert size={20} /> Vùng Hoạt Động Cấp Cao
         </h2>
         <div className="friendly-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'var(--danger-bg)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
               <div style={{ maxWidth: '450px' }}>
                  <h3 style={{ color: 'var(--danger)', fontSize: '16px', marginBottom: '4px' }}>Khóa Két Sắt Khẩn Cấp</h3>
                  <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '13.5px', margin: 0 }}>Toàn bộ thông tin ví, mục tài chính sẽ được khóa mã hóa ngay lập tức.</p>
               </div>
               <button onClick={onLogout} className="btn-primary" style={{ background: 'var(--danger)', color: 'white', padding: '12px 24px' }}>
                  <LogOut size={18} /> Lockdown
               </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed rgba(239, 68, 68, 0.4)', margin: '24px 0' }} />

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
               <div style={{ maxWidth: '450px' }}>
                  <h3 style={{ color: 'var(--danger)', fontSize: '16px', marginBottom: '4px' }}>Tiêu Hủy Không Vết Tích</h3>
                  <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '13.5px', margin: 0 }}>Chỉ dùng khi bị đe dọa. Tất cả số dư, lịch sử, nợ nần sẽ bốc hơi khỏi máy tính này.</p>
               </div>
               <button onClick={handleHardReset} className="btn-secondary" style={{ borderColor: 'var(--danger)', background: 'transparent', color: 'var(--danger)' }}>
                  <Flame size={18} /> Phá Hủy Tự Động
               </button>
            </div>
         </div>
      </section>

    </motion.div>
  );
}
