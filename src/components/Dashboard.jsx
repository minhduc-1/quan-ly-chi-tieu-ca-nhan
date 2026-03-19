import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/format';

export default function Dashboard({ transactions, goals, currency }) {
  const [activeModal, setActiveModal] = useState(null); 

  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const budget = 10000000;
  const budgetLeft = budget - totalExpense;
  const budgetPercent = Math.max(0, Math.min(100, (totalExpense / budget) * 100));

  const expenseCatMap = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    expenseCatMap[t.category] = (expenseCatMap[t.category] || 0) + Math.abs(t.amount);
  });
  
  const colors = ['#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f1c40f', '#1abc9c'];
  const pieData = Object.keys(expenseCatMap).map((cat, i) => ({ name: cat, value: expenseCatMap[cat], color: colors[i % colors.length] }));
  if (pieData.length === 0) pieData.push({ name: 'Chưa có', value: 1, color: 'var(--border-color)' });

  const incomeByMonth = {};
  transactions.filter(t => t.amount > 0).forEach(t => {
    let monthStr = t.date.includes('/') ? 'Th ' + t.date.split('/')[1] : 'Th ' + (new Date(t.date).getMonth() + 1);
    incomeByMonth[monthStr] = (incomeByMonth[monthStr] || 0) + t.amount; 
  });
  const barData = Object.keys(incomeByMonth).map(m => ({ 
     name: m, 
     value: currency === 'USD' ? incomeByMonth[m] / 25000 : incomeByMonth[m] / 10000 
  })).reverse();
  if (barData.length === 0) barData.push({ name: 'Chưa có', value: 0 });

  // EPIC 2: FINANCIAL HEALTH SCORE CALCULATION
  let healthScore = 50; 
  if (totalIncome > 0) {
    const saveRatio = (totalIncome - totalExpense) / totalIncome;
    if (saveRatio > 0.3) healthScore += 30; 
    else if (saveRatio > 0.1) healthScore += 15;
    else if (saveRatio < 0) healthScore -= 20; 
  }
  if (budgetLeft < 0) healthScore -= 20;
  else if (budgetLeft / budget < 0.2) healthScore -= 10;
  const goalsProgress = goals.reduce((sum, g) => sum + g.percent, 0) / (goals.length || 1);
  if (goalsProgress > 50) healthScore += 20;
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
  
  let healthLabel = ''; let healthColor = '';
  if (healthScore >= 80) { healthLabel = 'Tuyệt Vời'; healthColor = '#2ecc71'; }
  else if (healthScore >= 50) { healthLabel = 'Ổn định'; healthColor = '#f1c40f'; }
  else { healthLabel = 'Đáng báo động'; healthColor = '#e74c3c'; }

  // Cảm xúc & Gamification
  const emotionSums = { 'Vui vẻ': 0, 'Ba Bình': 0, 'Buồn chán': 0, 'Tức giận': 0 };
  transactions.filter(t => t.amount < 0 && t.emotion).forEach(t => {
     emotionSums[t.emotion] = (emotionSums[t.emotion] || 0) + Math.abs(t.amount);
  });
  const topEmotion = Object.keys(emotionSums).sort((a,b) => emotionSums[b] - emotionSums[a])[0];

  const getAIBehaviorInsight = () => {
    if (topEmotion === 'Buồn chán' || topEmotion === 'Tức giận') return `🚨 AI Cảm xúc: Bạn có vẻ hay đốt tiền (${formatCurrency(emotionSums[topEmotion], currency)}) lúc Tâm lý "${topEmotion}". Hãy thử đi bộ hoặc nghe nhạc thay vì mua sắm để gỡ gạc lỗi lầm!`;
    if (totalExpense > totalIncome && totalIncome > 0) return "🚨 Bạn đang tiêu lạm quá số tiền kiếm được. Hãy thắt chặt hầu bao ngay trong tuần này!";
    return "✅ Chúc mừng! Dòng tiền của bạn đang rất cân bằng, hãy tự động hóa việc đưa tiền vào Quỹ tiết kiệm mỗi đầu tháng.";
  };

  const renderModalData = () => {
     let filtered = []; let title = '';
     if(activeModal === 'expense') { filtered = transactions.filter(t => t.amount < 0); title = 'Danh sách Chi Tiêu Lịch Sử'; }
     if(activeModal === 'income') { filtered = transactions.filter(t => t.amount > 0); title = 'Danh sách Thu Nhập Lịch Sử'; }
     if(activeModal === 'balance' || activeModal === 'budget') { filtered = transactions; title = 'Biến Động Số Dư (Tất cả)'; }
     
     return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
           <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                 <h3>{title}</h3>
                 <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                 <table className="data-table">
                    <thead><tr><th>Ngày</th><th>Danh Mục</th><th>Ghi chú</th><th>Tiền</th></tr></thead>
                    <tbody>
                       {filtered.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Chưa có dữ liệu</td></tr>}
                       {filtered.map(t => (
                          <tr key={t.id}>
                             <td>{t.date}</td><td>{t.category}</td><td>{t.note}</td>
                             <td style={{ fontWeight: '600', color: t.amount < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount, currency)}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="animate-fade-in">
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveModal('expense')}>
          <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>Tổng Chi Tiêu <span>🔍</span></div>
          <div className="kpi-value text-red">{formatCurrency(totalExpense, currency)}</div>
        </div>
        <div className="kpi-card" onClick={() => setActiveModal('income')}>
          <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>Thu Nhập Theo Tháng <span>🔍</span></div>
          <div className="kpi-value text-green">{formatCurrency(totalIncome, currency)}</div>
        </div>
        <div className="kpi-card" onClick={() => setActiveModal('balance')}>
          <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>Số Dư Hiện Tại <span>🔍</span></div>
          <div className="kpi-value text-blue">{formatCurrency(balance, currency)}</div>
        </div>
        <div className="kpi-card" onClick={() => setActiveModal('budget')}>
          <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between' }}>Ngân Sách Tối Đa <span>🔍</span></div>
          <div className="kpi-value text-green" style={{ display: 'flex', alignItems: 'baseline', gap: '5px', color: budgetLeft < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {formatCurrency(budgetLeft, currency)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {formatCurrency(budget, currency)}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--input-border)', marginTop: '5px' }}>
             <div style={{ width: `${budgetPercent}%`, height: '100%', background: budgetPercent > 90 ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>
          </div>
          {budgetPercent >= 80 && budgetPercent < 100 && <div style={{ fontSize: '0.8rem', color: '#f39c12', marginTop: '5px' }}>⚠️ Sắp chạm trần ngân sách!</div>}
          {budgetPercent >= 100 && <div style={{ fontSize: '0.8rem', color: '#e74c3c', marginTop: '5px' }}>❌ Đã Vượt Ngân sách Quy Định!</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr) 300px', gap: '20px', marginBottom: '20px' }}>
        
        {/* Điểm Financial Health Score */}
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', alignItems: 'center', background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(46, 204, 113, 0.05) 100%)' }}>
           <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `conic-gradient(${healthColor} ${healthScore}%, #edf2f7 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: healthColor }}>{healthScore}</span>
                 <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>điểm</span>
              </div>
           </div>
           <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>Financial Health Score: Thể trạng {healthLabel}</h2>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Hệ thống Ai tự chấm điểm độ uy tín dữ liệu của bạn dựa trên tỉ lệ Tiết kiệm/Chi tiêu hàng tháng.</p>
              <div style={{ marginTop: '10px', padding: '10px 15px', background: 'rgba(255,255,255,0.8)', borderLeft: '4px solid #3498db', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
                 {getAIBehaviorInsight()}
              </div>
           </div>
        </div>

        {/* No Spend Challenge */}
        <div className="card" style={{ background: '#2ecc71', color: 'white', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
           <h3 style={{ margin: '0 0 5px 0' }}>🏃 No-Spend Challenge</h3>
           <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', opacity: 0.9 }}>Thử thách Không tiêu tiền</p>
           <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>🔥 3 Ngày</div>
           <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', fontWeight: '500' }}>Thành tích xuất sắc! Tiếp tục duy trì nhé.</p>
           <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.2 }}>🏆</div>
        </div>

        {/* Heatmap Layout */}
        <div className="card" style={{ gridColumn: 'span 2', position: 'relative', overflow: 'hidden', padding: 0 }}>
           <div style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 10 }}>
              <h3 style={{ margin: 0, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>📍 Bản Đồ Tọa Độ Nhiệt Chi Tiêu (Heatmap)</h3>
              <span style={{ fontSize: '0.8rem', color: 'white', background: 'red', padding: '2px 6px', borderRadius: '4px' }}>LIVE GPS MOCKUP</span>
           </div>
           <div style={{ height: '300px', background: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hanoi_OpenStreetMap.png/800px-Hanoi_OpenStreetMap.png) center/cover', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(30,41,59,0.3))' }}></div>
              <div style={{ position: 'absolute', top: '40%', left: '30%', width: '40px', height: '40px', background: 'radial-gradient(circle, rgba(231,76,60,0.8) 0%, rgba(231,76,60,0) 70%)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              <div style={{ position: 'absolute', top: '60%', left: '50%', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(241,196,15,0.8) 0%, rgba(241,196,15,0) 70%)', borderRadius: '50%', animation: 'pulse 3s infinite' }}></div>
              <div style={{ position: 'absolute', top: '30%', left: '70%', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(231,76,60,0.8) 0%, rgba(231,76,60,0) 70%)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
           </div>
        </div>

        <div className="card" style={{ gridRow: 'span 2' }}>
          <div className="card-title">Mục Tiêu Tiết Kiệm</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {goals.length === 0 && <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Chưa thiết lập mục tiêu.</span>}
            {goals.map(goal => (
              <div key={goal.id}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: 'var(--accent-blue)' }}>🎯</span> {goal.name}</div>
                   <div style={{ fontWeight: '600' }}>{goal.percent}%</div>
                 </div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Đạt được: {formatCurrency(goal.current, currency)} / {formatCurrency(goal.target, currency)}</div>
                 <div style={{ width: '100%', height: '6px', background: 'var(--input-border)', borderRadius: '3px' }}>
                    <div style={{ width: `${goal.percent}%`, height: '100%', background: 'var(--bg-topbar)', borderRadius: '3px' }}></div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Phân bổ Chi Tiêu</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trực Tiếp</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: '220px' }}>
             <div style={{ width: '50%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip formatter={(val)=>`${formatCurrency(val, currency)}`}/></PieChart></ResponsiveContainer>
             </div>
             <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '100%' }}>
                {pieData.map(item => (<div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}><span style={{ width: '10px', height: '10px', background: item.color, borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}></span> <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.name}</span></div>))}
             </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 3' }}>
           <div className="card-title">Giao Dịch Gần Nhất & Cảm Xúc</div>
           <div style={{ overflowX: 'auto' }}>
             <table className="data-table">
                <thead><tr><th>Tâm lý</th><th>Ngày Ghi</th><th>Diễn Giải</th><th>Số Tiền Thực Tế</th><th>Trạng Thái Ghi Chú</th></tr></thead>
                <tbody>
                   {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id}>
                         <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                            {tx.emotion === 'Vui vẻ' ? '😄' : tx.emotion === 'Buồn chán' ? '😢' : tx.emotion === 'Tức giận' ? '😡' : '😐'}
                         </td>
                         <td>{tx.date}</td><td style={{ fontWeight: '500' }}>{tx.category}</td>
                         <td style={{ fontWeight: '600', color: tx.amount < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}</td>
                         <td style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{tx.note || '--'}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
      {activeModal && renderModalData()}
    </div>
  );
}
