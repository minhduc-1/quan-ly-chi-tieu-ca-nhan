import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';
import { PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';

export default function Reports({ transactions, currency }) {
  const expenseTransactions = transactions.filter(t => t.amount < 0);
  const categories = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const barData = Object.entries(categories)
    .map(([name, value]) => ({ name, 'Đã chi': value }))
    .sort((a, b) => b['Đã chi'] - a['Đã chi']);

  const CustomTooltipInner = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="friendly-card" style={{ padding: '12px 16px' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--danger)', fontWeight: 500 }}>
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Insight & Social Rank */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
         <div className="friendly-card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', border: 'none' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
               <Globe size={24} /> Bảng Vàng Thuật Toán Xếp Hạng
            </h3>
            <p style={{ opacity: 0.9, fontSize: '15px' }}>Dựa trên tỷ lệ tiết kiệm tháng này (45%), bạn đang nằm trong:</p>
            <div style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
               Top 15%
            </div>
            <p style={{ opacity: 0.8, fontSize: '13px', marginTop: '8px' }}>Cộng đồng Khách hàng Ưu tú Nhất Hệ thống Vercel Cloud.</p>
         </div>

         <div className="friendly-card" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>KPI So Sánh Dòng Tiền (Tháng)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--success-bg)', borderRadius: '12px' }}>
                  <div style={{ color: 'var(--success)', fontWeight: '600' }}>Tốc độ Gia Tăng (Thu nhập)</div>
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontWeight: 'bold' }}><ArrowUpRight size={18}/> +12.4%</div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--danger-bg)', borderRadius: '12px' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: '600' }}>Biên độ Rơi (Chi tiêu)</div>
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--danger)', fontWeight: 'bold' }}><ArrowDownRight size={18}/> -5.2%</div>
               </div>
            </div>
         </div>
      </div>

      {/* Bar Chart Danh mục */}
      <div className="friendly-card" style={{ padding: '32px' }}>
         <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <PieChartIcon size={24} color="var(--primary)" /> Mật Độ Điểm Nóng Danh Mục
         </h3>
         <div style={{ height: '400px' }}>
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
               <defs>
                 <linearGradient id="barColor" x1="0" y1="0" x2="1" y2="0">
                   <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8}/>
                   <stop offset="100%" stopColor="var(--accent)" stopOpacity={1}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} />
               <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
               <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{fontSize: 13, fontWeight: 500}} axisLine={false} tickLine={false} />
               <RechartsTooltip cursor={{ fill: 'var(--border-glass)' }} content={<CustomTooltipInner />} />
               <Bar dataKey="Đã chi" fill="url(#barColor)" radius={[0, 8, 8, 0]} barSize={24} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
      
      {/* Table Lịch sử */}
      <div className="friendly-card" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '16px' }}>Sổ Cái Giao Dịch Gốc</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>Ngày</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>Danh Mục</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>Ghi Chú</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', textAlign: 'right' }}>Số Tiền</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={idx} style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{t.date}</td>
                <td style={{ padding: '16px', fontWeight: '500' }}>
                  <span className="badge" style={{ background: 'var(--surface-opaque)' }}>{t.category}</span>
                </td>
                <td style={{ padding: '16px' }}>{t.note}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: t.amount > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {t.amount > 0 ? '+' : ''}{formatCurrency(t.amount, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </motion.div>
  );
}
