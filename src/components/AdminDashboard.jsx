import { useState, useEffect } from 'react';
import { getLogs } from '../services/AuditService';

export default function AdminDashboard({ onLogout }) {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // Tải logs từ StorageService đã mã hoá khi render
    setLogs(getLogs());
  }, []);

  return (
    <div className="app-container" style={{ background: '#f8fafc', overflowY: 'auto', display: 'block' }}>
       <div style={{ background: '#1e293b', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <span style={{ fontSize: '1.8rem' }}>🛡️</span>
             <div>
                <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Hệ Thống Phân Quyền Giám Đốc (Admin Dashboard)</h1>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>SmartFinance Enterprise Edition</p>
             </div>
          </div>
          <button onClick={onLogout} className="btn-primary" style={{ background: '#e74c3c' }}>Đăng xuất Khỏi Quyền Quản Trị</button>
       </div>

       <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div className="card" style={{ borderLeft: '4px solid #3498db' }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Tổng Lượt Truy Cập</h3>
               <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '5px 0 0 0', color: '#3498db' }}>{logs.filter(l => l.action.includes('Đăng nhập')).length}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #e74c3c' }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Cảnh báo Bảo mật Cấp 1</h3>
               <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '5px 0 0 0', color: '#e74c3c' }}>{logs.filter(l => l.action.includes('Cảnh báo') || l.action.includes('Đăng nhập sai')).length}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #2ecc71' }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Log Dữ Liệu Hoá Đơn</h3>
               <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '5px 0 0 0', color: '#2ecc71' }}>{logs.filter(l => l.action.includes('Giao dịch')).length}</p>
            </div>
         </div>

         <div className="card" style={{ padding: '30px' }}>
           <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>Nhật ký Hoạt động Thiết bị (Audit Logs)</h2>
           <p style={{ color: 'var(--text-muted)' }}>Bảng theo dõi 100% thời gian thực các sự kiện truy vết Dịch vụ API và Hệ thống.</p>
           
           <div style={{ marginTop: '20px', maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                 <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-main)', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <tr>
                       <th style={{ padding: '15px' }}>Thời gian</th>
                       <th style={{ padding: '15px' }}>Tài khoản Định danh</th>
                       <th style={{ padding: '15px' }}>Zone / Hành động Thực thi</th>
                       <th style={{ padding: '15px' }}>Chi tiết Dữ liệu</th>
                    </tr>
                 </thead>
                 <tbody>
                    {logs.map(log => (
                       <tr key={log.id}>
                          <td style={{ padding: '15px' }}>{log.timestamp}</td>
                          <td style={{ padding: '15px', fontWeight: '600', color: 'var(--accent-blue)' }}>{log.user}</td>
                          <td style={{ padding: '15px' }}>
                             <span style={{ 
                                padding: '6px 12px', 
                                background: log.action.includes('Cảnh báo') || log.action.includes('chặn') ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)', 
                                color: log.action.includes('Cảnh báo') || log.action.includes('chặn') ? '#e74c3c' : '#3498db', 
                                borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500' 
                             }}>
                                {log.action}
                             </span>
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{log.details}</td>
                       </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>Hệ thống chưa ghi nhận truy vết nào.</td></tr>}
                 </tbody>
              </table>
           </div>
         </div>
       </div>
    </div>
  );
}
