import { useState } from 'react';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { saveData, loadData } from '../services/StorageService';
import { logAction } from '../services/AuditService';
import { DownloadCloud, UploadCloud, Coins, ShieldAlert } from 'lucide-react';

export default function Settings({ user, onLogout, currency, setCurrency }) {
  const [msg, setMsg] = useState('');

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
      audit_logs: loadData('audit_logs', [])
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smart_expense_full_backup.json';
    link.click();
    logAction(user?.email, 'Export JSON Full', 'Tạo điểm ảnh hệ thống JSON (Full Dump)');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px' }}>
      
      {/* Trung tâm Định dạng Tiền Tệ */}
      <div className="friendly-card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
           <Coins size={20} color="var(--warning)" /> Định Dạng Tiền Tệ Tỷ Giá
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Hệ thống tự động quy đổi ngoại tệ (Mô phỏng)</p>
        
        <select 
          value={currency} 
          onChange={(e) => {
             setCurrency(e.target.value);
             logAction(user?.email, 'Đổi Tiền tệ', `Chuyển đơn vị hiển thị sang ${e.target.value}`);
          }} 
          className="input-glass"
          style={{ width: '100%', appearance: 'none', background: 'var(--surface-opaque)' }}
        >
          <option value="VND">Tiền Việt (VNĐ)</option>
          <option value="USD">Dollar Mỹ (USD $)</option>
          <option value="EUR">Euro Châu Âu (EUR €)</option>
          <option value="JPY">Yên Nhật (JPY ¥)</option>
        </select>
      </div>

      {/* Trung Tâm Dữ Liệu Lõi */}
      <div className="friendly-card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
           <ShieldAlert size={20} color="var(--primary)" /> An Toàn Dữ Liệu Cục Bộ (AES Backup)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           <button onClick={exportCSV} className="btn-primary" style={{ background: 'var(--surface-opaque)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}>
             <DownloadCloud size={18} /> Kết Xuất CSV Cơ Bản
           </button>
           
           <button onClick={exportJSON} className="btn-primary" style={{ background: 'var(--primary)', color: 'white' }}>
             <DownloadCloud size={18} /> Chụp Thể Block Hệ Thống (JSON Full)
           </button>

           <div style={{ position: 'relative' }}>
             <label className="btn-primary" style={{ background: 'var(--success)', color: 'white', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}>
               <UploadCloud size={18} /> Ghi Đè Database Cũ (Import CSV)
               <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} />
             </label>
           </div>
           
           {msg && <p style={{ color: 'var(--success)', fontSize: '14px', textAlign: 'center', margin: 0 }}>{msg}</p>}
        </div>
      </div>
      
      <div className="friendly-card" style={{ padding: '24px', gridColumn: '1 / -1', border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
         <h3 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Khu Vực Nguy Hiểm (Vùng Trắng)</h3>
         <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Toàn bộ thiết lập, số lượng mục tiêu và lịch sử hoạt động sẽ bị xoá khỏi LocalStorage cục bộ nếu bạn Đăng xuất khỏi phân vùng này.</p>
         <button onClick={onLogout} className="btn-primary" style={{ background: 'var(--danger)', color: 'white' }}>
            Huỷ Kết Nối & Thoát Hoàn Toàn 
         </button>
      </div>

    </motion.div>
  );
}
