import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { formatCurrency } from '../utils/format';
import { TrendingUp, TrendingDown, Target, Wallet, AlertOctagon, Zap } from 'lucide-react';
import SmartInsights from './SmartInsights';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function Dashboard({ transactions, goals, currency }) {
  const expenseTransactions = transactions.filter(t => t.amount < 0);
  const incomeTransactions = transactions.filter(t => t.amount > 0);
  
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Tính toán Budget (Góp phần tăng UX cho UI)
  const monthlyBudget = 20000000; // Hardcode ví dụ
  const budgetUsedPercent = (totalExpense / monthlyBudget) * 100;
  
  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="friendly-card" style={{ padding: '12px 16px', border: '1px solid var(--border-glass)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((p, i) => (
             <p key={i} style={{ margin: '4px 0 0 0', color: p.color, fontWeight: 500 }}>
               {p.name}: {formatCurrency(Math.abs(p.value), currency)}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chuẩn bị dữ liệu danh mục
  const categories = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const pieData = Object.entries(categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Chuẩn bị Dữ liệu 7 ngày gần nhất
  const today = new Date();
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('vi-VN');
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayTx = transactions.filter(t => t.date === date);
    const inC = dayTx.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const outC = dayTx.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { name: date.slice(0, 5), 'Thu': inC, 'Chi': outC };
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 3 Thẻ Chỉ Số Thông Minh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <motion.div variants={itemVariants} className="friendly-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--primary-bg)', padding: '12px', borderRadius: '16px', color: 'var(--primary)' }}>
                <Wallet size={24} />
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Tổng Số Dư</h3>
            </div>
            <span className="badge" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>Live</span>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {formatCurrency(balance, currency)}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="friendly-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--success-bg)', padding: '12px', borderRadius: '16px', color: 'var(--success)' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Tổng Thu Nhập</h3>
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--success)', letterSpacing: '-0.02em' }}>
            +{formatCurrency(totalIncome, currency)}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="friendly-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--danger-bg)', padding: '12px', borderRadius: '16px', color: 'var(--danger)' }}>
                <TrendingDown size={24} />
              </div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Tổng Chi Tiêu</h3>
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--danger)', letterSpacing: '-0.02em' }}>
            -{formatCurrency(totalExpense, currency)}
          </p>
          
          {/* Progress Bar Ngân Sách Xịn */}
          <div style={{ marginTop: '16px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
               <span>Đã dùng {budgetUsedPercent.toFixed(1)}% ngân sách</span>
               <span>{formatCurrency(monthlyBudget, currency)}</span>
             </div>
             <div style={{ height: '8px', background: 'var(--border-glass)', borderRadius: '10px', overflow: 'hidden' }}>
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                 transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                 style={{ 
                   height: '100%', 
                   background: budgetUsedPercent > 90 ? 'var(--danger)' : budgetUsedPercent > 75 ? 'var(--warning)' : 'var(--success)',
                   borderRadius: '10px'
                 }}
               ></motion.div>
             </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <SmartInsights transactions={transactions} currency={currency} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Biểu đồ Biến Động */}
        <motion.div variants={itemVariants} className="friendly-card" style={{ padding: '24px' }}>
           <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Zap size={20} color="var(--primary)"/> Biến động Dòng tiền 7 Ngày Xu Hướng
           </h3>
           <div style={{ height: '320px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorChi" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                 <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12}} dy={10} axisLine={false} tickLine={false} />
                 <YAxis stroke="var(--text-muted)" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                 <RechartsTooltip content={<CustomTooltip />} />
                 <Area type="monotone" dataKey="Thu" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorThu)" />
                 <Area type="monotone" dataKey="Chi" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorChi)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Biểu đồ Tròn Thẩm Mỹ */}
        <motion.div variants={itemVariants} className="friendly-card" style={{ padding: '24px' }}>
           <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <PieChart size={20} color="var(--accent)"/> Cấu Trúc Chi Tiêu
           </h3>
           {pieData.length > 0 ? (
             <div style={{ height: '280px' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%" cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip content={<CustomTooltip />} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               Chưa có dữ liệu giao dịch
             </div>
           )}
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
             {pieData.slice(0, 4).map((entry, index) => (
               <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                 <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                 {entry.name}
               </div>
             ))}
           </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
