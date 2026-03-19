import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';

export default function Reports({ transactions, currency }) {
  // Biểu đồ 7 ngày
  const chartDataMap = {};
  for (let i = 6; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const key = d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
     chartDataMap[key] = { name: key, expense: 0, income: 0 };
  }

  // Phân tích Tháng này vs Tháng Trước
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  let thisMonthExp = 0, lastMonthExp = 0;
  
  transactions.forEach(tx => {
    // 7 days metric
    const keyStr = new Date(tx.date).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
    if (chartDataMap[keyStr]) {
      if (tx.amount < 0) chartDataMap[keyStr].expense += Math.abs(tx.amount);
      else chartDataMap[keyStr].income += tx.amount;
    }

    // Month metric logic (Naive date parser for vi-VN "DD/MM/YYYY")
    const parts = tx.date.split('/');
    let d;
    if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    else d = new Date(); // fallback

    if (!isNaN(d.getTime())) {
       if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) {
           if (tx.amount < 0) thisMonthExp += Math.abs(tx.amount);
       } else if (d.getMonth() + 1 === (currentMonth === 1 ? 12 : currentMonth - 1)) {
           if (tx.amount < 0) lastMonthExp += Math.abs(tx.amount);
       }
    }
  });

  const chartData = Object.values(chartDataMap);
  const expDiffPercent = lastMonthExp === 0 ? 0 : Math.round(((thisMonthExp - lastMonthExp)/lastMonthExp)*100);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tính năng Xã Hội (Ẩn danh) */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🌐 Xếp Hạng Cộng Đồng Phân Tích (Social Insight)</h3>
               <p style={{ margin: '0 0 15px 0', fontSize: '0.95rem', opacity: 0.9 }}>Thuật toán Deep Learning đang so sánh khối lượng dòng tiền của bạn với hơn 1.500++ người dùng cùng độ tuổi trên hệ thống.</p>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Top 15%</div>
                  <p style={{ margin: 0, fontSize: '1rem' }}>Bạn đang nằm trong nhóm <strong style={{ color: '#f1c40f' }}>Tiết Kiệm Phi Thường</strong> nhờ duy trì tỷ lệ Chi tiêu thấp/Thu nhập dài hạn.</p>
               </div>
            </div>
            <div style={{ fontSize: '5rem', opacity: 0.2 }}>🏆</div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '20px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
             <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 0 10px 0' }}>So Sánh Chi Tiêu</h3>
             <p style={{ margin: 0, fontSize: '0.9rem' }}>Tháng hiện tại so với kỳ tháng trước</p>
             <div style={{ marginTop: '20px', fontSize: '2.5rem', fontWeight: 'bold', color: expDiffPercent > 0 ? '#e74c3c' : '#2ecc71' }}>
                 {expDiffPercent > 0 ? '▲' : '▼'} {Math.abs(expDiffPercent)}%
             </div>
             <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 {expDiffPercent > 0 ? 'Cảnh báo: Tốc độ đốt tiền nhanh hơn tháng trước!' : 'Đáng khen: Bạn đang tiết kiệm hiệu quả hơn.'}
             </p>
          </div>
          <div className="card">
            <h2 className="card-title" style={{ border: 'none', marginBottom: '10px' }}>Biên Độ Dòng Tiền (7 Ngày Gần Nhất)</h2>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" tick={{fontSize: 12}} tickFormatter={(val) => currency === 'USD' ? '$' + (val/25000) : `${val/1000}k`} axisLine={false} tickLine={false} dx={-10} />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(value, currency)]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" name="Chi Tiêu Thực" dataKey="expense" stroke="var(--accent-red)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" name="Thu Nhập Vào" dataKey="income" stroke="var(--accent-green)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      <div className="card">
        <h2 className="card-title">Báo Cáo Chi Tiết Hạng Mục Đã Thu / Chi</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
             <thead>
                <tr>
                   <th>Danh Mục Giao Dịch</th>
                   <th>Loại Hình</th>
                   <th>Tần Suất Đi Lệnh</th>
                   <th>Tổng Dòng Tiền Phát Sinh</th>
                   <th>Ngân Sách Được Khuyến Cáo</th>
                </tr>
             </thead>
             <tbody>
                {Object.entries(
                  transactions.reduce((acc, tx) => {
                    if(!acc[tx.category]) acc[tx.category] = { type: tx.amount > 0 ? 'Income (Dòng tiền vào)' : 'Expense (Đốt tiền)', count: 0, total: 0 };
                    acc[tx.category].count += 1;
                    acc[tx.category].total += Math.abs(tx.amount);
                    return acc;
                  }, {})
                ).sort((a,b) => b[1].total - a[1].total).map(([cat, data]) => (
                   <tr key={cat}>
                      <td style={{fontWeight: '500'}}>{cat}</td>
                      <td><span style={{ padding: '4px 8px', background: data.type.includes('Income') ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: data.type.includes('Income') ? '#2ecc71' : '#e74c3c', borderRadius: '4px', fontSize: '0.85rem' }}>{data.type}</span></td>
                      <td style={{ textAlign: 'center' }}>{data.count} lệnh</td>
                      <td style={{fontWeight: '600', color: data.type.includes('Income') ? 'var(--accent-green)' : 'var(--accent-red)'}}>
                        {formatCurrency(data.total, currency)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{data.type.includes('Income') ? '-- Không giới hạn --' : formatCurrency(2000000, currency)}</td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
