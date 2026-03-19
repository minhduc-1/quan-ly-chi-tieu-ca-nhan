import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { saveData, loadData } from '../services/StorageService';
import { logAction } from '../services/AuditService';

export default function Settings({ user, onLogout, currency, setCurrency }) {
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleExportData = () => {
    const tx = loadData('tx_data', []);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tx));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "smart_finance_backup.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    logAction(user?.email, 'Backup/Restore', 'Xuất file mã hoá hệ thống (JSON)');
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    if(file.name.endsWith('.json')) {
       const reader = new FileReader();
       reader.onload = (e) => {
          try {
             const data = JSON.parse(e.target.result);
             if (Array.isArray(data)) {
                 saveData('tx_data', data);
                 logAction(user?.email, 'Backup/Restore', 'Hoàn tất Khôi phục hệ thống qua JSON Backup');
                 alert('Khôi phục hệ thống JSON thành công! Vui lòng làm mới (F5) trang.');
                 window.location.reload();
             } else alert('Cấu trúc file JSON hỏng');
          } catch(err) { alert('File JSON không hợp lệ'); }
       };
       reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
       Papa.parse(file, {
          header: true,
          complete: function(results) {
             const transactions = loadData('tx_data', []);
             const newTxs = results.data.map(row => ({
                id: Date.now() + Math.random(),
                date: row.date || new Date().toLocaleDateString('vi-VN'),
                category: row.category || 'Khởi Tạo CSV',
                amount: Number(row.amount) || Number(row.Amount) || parseInt(row.Sotien) || 0,
                note: row.note || row.ghi_chu || row.Note || 'Imported từ CSV'
             })).filter(tx => tx.amount !== 0);
             saveData('tx_data', [...newTxs, ...transactions]);
             logAction(user?.email, 'Backup/Restore', `Import Database thành công ${newTxs.length} dòng qua CSV`);
             alert(`Bơm thành công ${newTxs.length} dòng dữ liệu từ CSV! Vui lòng nhấn OK để tải lại.`);
             window.location.reload();
          }
       });
    } else {
       alert('Định dạng không được hỗ trợ. Vui lòng chọn JSON hoặc CSV');
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
      <h2 className="card-title" style={{ fontSize: '1.4rem', borderBottom: 'none', marginBottom: '20px' }}>Cài Đặt Hệ Thống</h2>
      
      <div style={{ marginBottom: '30px', padding: '20px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img src={user?.avatar || 'https://ui-avatars.com/api/?name=Admin'} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{user?.name || 'Giám Đốc Hệ Thống'}</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user?.email || 'admin@gmail.com'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
         <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Giao Diện Màu Chữ Thể Hiện</label>
         <select className="input-field" value={theme} onChange={handleThemeChange}>
            <option value="light">☀️ Giao diện Sáng tinh tế (Mặc định)</option>
            <option value="dark">🌙 Chế độ Nghệ Thuật Đen (Dark Mode)</option>
         </select>
      </div>

      <div style={{ marginBottom: '30px' }}>
         <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tâm Điểm Ngoại Tệ So Sánh Toàn Cầu</label>
         <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="VND">Tiền Việt Nam (VNĐ)</option>
            <option value="USD">Quy đổi sang Đô La Mỹ ($ USD)</option>
         </select>
      </div>

      <div style={{ padding: '20px', background: 'rgba(52, 152, 219, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '30px' }}>
         <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Bảo Vệ Sao Lưu & Phục Hồi Dữ Liệu</h3>
         <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button onClick={handleExportData} className="btn-primary" style={{ background: '#3498db' }}>⬇️ Trích xuất Lõi Dữ liệu (Backup JSON)</button>
            <label className="btn-primary" style={{ background: '#2ecc71', cursor: 'pointer', textAlign: 'center' }}>
               ⬆️ Bơm Dữ Liệu Hàng Loạt (Upload .CSV hoặc .JSON)
               <input type="file" accept=".csv, .json" style={{ display: 'none' }} onChange={handleImportCSV} />
            </label>
         </div>
         <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>*Quá trình Import CSV yêu cầu cột Cấu trúc chứa trường `amount`, `category`, `date`, `note`.</p>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
         <button onClick={onLogout} className="btn-primary" style={{ background: 'var(--accent-red)', width: '100%', fontSize: '1rem', padding: '12px' }}>
            Đăng Xuất Quyền Truy Cập Phiên
         </button>
      </div>
    </div>
  );
}
