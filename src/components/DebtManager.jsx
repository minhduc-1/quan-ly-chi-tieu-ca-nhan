import { useState } from 'react';
import { formatCurrency } from '../utils/format';
import { logAction } from '../services/AuditService';

export default function DebtManager({ currency }) {
  const [debts, setDebts] = useState([
     { id: 1, type: 'borrowed', name: 'Ngân hàng VCB (Trả Góp Điện Thoại)', amount: 15000000, date: '10/04/2022', status: 'pending' },
     { id: 2, type: 'lent', name: 'Minh Hoàng (Mượn đóng tiền nhà)', amount: 2000000, date: '15/04/2022', status: 'pending' },
     { id: 3, type: 'lent', name: 'Trần Anh (Ăn nhậu tuần trước)', amount: 450000, date: '01/04/2022', status: 'paid' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('borrowed'); 
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');

  // TÍNH NĂNG ĐỒ ÁN: SPLIT BILL CỘNG ĐỒNG
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [splitEvent, setSplitEvent] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitPeople, setSplitPeople] = useState(2);

  const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
  const totalLent = debts.filter(d => d.type === 'lent' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  const handleAddDebt = (e) => {
     e.preventDefault();
     if(!formName || !formAmount) return;
     const newDebt = {
        id: Date.now(),
        type: formType,
        name: formName,
        amount: Number(formAmount),
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'pending'
     };
     setDebts([newDebt, ...debts]);
     setShowForm(false);
     setFormName(''); setFormAmount('');
     logAction(null, 'Tạo Sổ Nợ', `Tạo giao dịch nợ mới: ${newDebt.name} (${newDebt.amount}đ)`);
  };

  const handleSplitBill = (e) => {
     e.preventDefault();
     if (!splitEvent || !splitAmount || splitPeople <= 1) return;
     const total = Number(splitAmount);
     const perPerson = Math.round(total / splitPeople);
     
     const newDebts = [];
     for(let i = 1; i < splitPeople; i++) {
        newDebts.push({
           id: Date.now() + i,
           type: 'lent',
           name: `Người thứ ${i} (Sự kiện: ${splitEvent})`,
           amount: perPerson,
           date: new Date().toLocaleDateString('vi-VN'),
           status: 'pending'
        });
     }
     setDebts([...newDebts, ...debts]);
     setShowSplitBill(false);
     setSplitEvent(''); setSplitAmount(''); setSplitPeople(2);
     alert(`✅ Thuật toán Split Bill chạy thành công!\nBạn đã ứng trước trả hoá đơn. Đã tự động tạo lệnh Đòi nợ ${splitPeople - 1} người còn lại vào hệ thống.`);
     logAction(null, 'Chia tiền Nhóm', `Đã chia tách hoá đơn ${splitEvent} cho ${splitPeople} người`);
  };

  const toggleStatus = (id) => {
     setDebts(debts.map(d => d.id === id ? { ...d, status: d.status === 'pending' ? 'paid' : 'pending' } : d));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
         <div className="card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Tổng Nợ Phải Trả</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>
               {formatCurrency(totalBorrowed, currency)}
            </div>
         </div>
         <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Tổng Tiền Chờ Thu Hồi (Lent)</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
               {formatCurrency(totalLent, currency)}
            </div>
         </div>
      </div>

      <div className="card">
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="card-title" style={{ margin: 0, border: 'none' }}>Danh sách Sổ Nợ / Split Bill</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
               <button onClick={() => setShowSplitBill(true)} className="btn-primary" style={{ background: '#9b59b6' }}>🍕 Chia Tiền Hóa Đơn Chung</button>
               <button onClick={() => setShowForm(true)} className="btn-primary">+ Thiết Lập Giao Dịch Nợ Mới</button>
            </div>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
               <thead>
                  <tr>
                     <th>Người liên quan</th>
                     <th>Phân Loại Lệnh</th>
                     <th>Giá trị Khoản Nợ</th>
                     <th>Ngày Lập Hợp Đồng</th>
                     <th>Trạng thái Thu Hồi</th>
                     <th>Duyệt Lệnh</th>
                  </tr>
               </thead>
               <tbody>
                  {debts.map(d => (
                     <tr key={d.id} style={{ opacity: d.status === 'paid' ? 0.6 : 1 }}>
                        <td style={{ fontWeight: '500' }}>{d.name}</td>
                        <td>{d.type === 'borrowed' ? 'Trách nhiệm phải thanh toán' : 'Chờ thu hồi vốn'}</td>
                        <td style={{ fontWeight: 'bold', color: d.type === 'borrowed' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                           {formatCurrency(d.amount, currency)}
                        </td>
                        <td>{d.date}</td>
                        <td>
                           <span style={{ 
                              padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', 
                              background: d.status === 'paid' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                              color: d.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)'
                           }}>
                              {d.status === 'paid' ? 'Đã Quyết Toán Xong' : 'Chưa Tất Toán'}
                           </span>
                        </td>
                        <td>
                           <button onClick={() => toggleStatus(d.id)} style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '4px', color: 'var(--text-main)', fontWeight: '500' }}>
                              {d.status === 'paid' ? 'Huỷ Đóng Sổ' : 'Gạch Nợ Đã Trả'}
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showForm && (
         <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Ghi Sổ Nợ</h3>
                  <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
               </div>
               <form onSubmit={handleAddDebt}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                     <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="radio" name="dType" checked={formType === 'borrowed'} onChange={() => setFormType('borrowed')} /> Mình đi mượn
                     </label>
                     <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="radio" name="dType" checked={formType === 'lent'} onChange={() => setFormType('lent')} /> Người ta vay mình
                     </label>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>Tên người / Đơn vị (Đối chiếu)</label>
                     <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder="VD: Khách hàng A..." required />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>Số tiền (Nhập hệ VNĐ)</label>
                     <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="input-field" placeholder="0 đ" required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Lưu vào Sổ Cố Định</button>
               </form>
            </div>
         </div>
      )}

      {/* FORM SPLIT BILL */}
      {showSplitBill && (
         <div className="modal-backdrop animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🍕 Chia Tiền Hóa Đơn (Split Bill)</h3>
                  <button onClick={() => setShowSplitBill(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
               </div>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Nếu bạn là người đứng ra trả tiền hoá đơn Nhóm, công cụ này sẽ tự động chia đều và tạo các sổ nợ đòi tiền gửi đến bảng Điều khiển.</p>
               
               <form onSubmit={handleSplitBill}>
                  <div style={{ marginBottom: '15px' }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>Sự kiện / Bữa ăn</label>
                     <input type="text" value={splitEvent} onChange={e => setSplitEvent(e.target.value)} className="input-field" placeholder="VD: Ăn lẩu Haidilao phòng MKT" required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>Tổng toàn bộ Bill (Bạn đã trả)</label>
                     <input type="number" value={splitAmount} onChange={e => setSplitAmount(e.target.value)} className="input-field" placeholder="2,000,000" required />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                     <label style={{ display: 'block', marginBottom: '5px' }}>Có bao nhiêu người tham gia? (Gồm cả bạn)</label>
                     <input type="number" min="2" max="50" value={splitPeople} onChange={e => setSplitPeople(e.target.value)} className="input-field" placeholder="Chia cho mấy người?" required />
                  </div>
                  
                  {splitAmount && splitPeople > 0 && (
                     <div style={{ padding: '15px', background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                        <strong>Phép tính: </strong> {Number(splitAmount).toLocaleString('vi-VN')} đ ÷ {splitPeople} = <br/>
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{Math.round(Number(splitAmount)/splitPeople).toLocaleString('vi-VN')} đ / người</span> 
                     </div>
                  )}

                  <button type="submit" className="btn-primary" style={{ width: '100%', background: '#9b59b6' }}>Phân Rã Toán Học & Kích Hoạt Đòi Nợ</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
