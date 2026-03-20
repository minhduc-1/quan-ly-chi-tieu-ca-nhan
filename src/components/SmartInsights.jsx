import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, ShieldCheck, Flame, HeartPulse } from 'lucide-react';
import GoalTracker from './GoalTracker';

export default function SmartInsights({ transactions, currency }) {
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    // Thuật toán: Emotional Analysis & No-Spend Challenge
    const today = new Date().toLocaleDateString('vi-VN');
    const dayTx = transactions.filter(t => t.date === today && t.amount < 0);
    const dayTotal = dayTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    let score = 100; // Khởi điểm tín nhiệm
    let recommendations = [];
    let state = 'Tích cực';
    let emotion = 'Bình thường';
    
    // Tính No-spend streak (Chuỗi ngày không tiêu tiền)
    let noSpendStreak = 0;
    const pastDates = Array.from({length: 10}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString('vi-VN');
    });
    for (let d of pastDates) {
       const spent = transactions.filter(t => t.date === d && t.amount < 0).length;
       if (spent === 0) noSpendStreak++;
       else break;
    }

    // Logic Đánh giá Tín Nhiệm (Health Score)
    if (dayTotal > 5000000) {
      score -= 30;
      state = 'Báo động';
      emotion = 'FOMO / Phung phí';
      recommendations.push("Chi tiêu lố ngân sách ngày. Hãy ngừng mở các trang TMĐT!");
    } else if (dayTotal > 1000000 && isWeekend) {
      score -= 10;
      state = 'Lưu ý';
      emotion = 'Vui vẻ quá đà';
      recommendations.push("Cuối tuần chắp cánh cho bạn vung tiền. Giới hạn lại 50% thôi!");
    } else if (noSpendStreak > 0) {
       score += 10;
       emotion = 'Kỷ luật Thép';
       recommendations.push(`Tuyệt vời! Bạn đang có chuỗi ${noSpendStreak} ngày không tốn một xu.`);
    }

    // Phân nhỏ danh mục
    const categories = dayTx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    
    if (categories['Ăn uống'] > 500000) {
        recommendations.push("Phát hiện mua đồ ăn quá đà. Bạn có buồn bực gì không? Hãy tự nấu ăn để giải toả nhé.");
    }
    
    if (recommendations.length === 0) recommendations.push("Tiếp tục duy trì phong độ giữ tiền đỉnh cao này!");

    setInsight({ score: Math.max(0, Math.min(score, 100)), state, emotion, recommendations, streak: noSpendStreak });
  }, [transactions]);

  if (!insight) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
      
      {/* Khung Phân Tích Cảm Xúc & Điểm Tín Nhiệm */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="friendly-card" style={{ padding: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
             <HeartPulse size={20} color="var(--primary)" /> Financial Health Score
           </h3>
           <span className={`badge ${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'}`}>
             Cấp độ: {insight.score >= 80 ? 'Tín Nhiệm Cao' : insight.score >= 50 ? 'Trung bình' : 'Nguy Hiểm'}
           </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
           <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'}) ${insight.score}%, var(--border-glass) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--surface-opaque)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '28px', color: `var(--${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'})` }}>
                {insight.score}
             </div>
           </div>
           
           <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Thuật toán Bắt Mạch Tâm Lý:</p>
              
              <div style={{ background: 'var(--surface-opaque)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Flame size={16} color="var(--warning)" />
                 <span style={{ fontSize: '14px', fontWeight: '600' }}>Tâm lý hôm nay: {insight.emotion}</span>
              </div>

              {insight.streak > 0 && (
                 <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                   🔥 No-Spend Challenge: {insight.streak} Ngày Kỷ Lục
                 </div>
              )}
           </div>
        </div>

        {/* Cảnh báo AI */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
           <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <ShieldCheck size={16} /> Lời khuyên Độc quyền từ AI
           </h4>
           <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {insight.recommendations.map((rec, i) => (
                <li key={i} style={{ fontSize: '14px', padding: '12px 16px', background: 'var(--surface-opaque)', borderRadius: '12px', borderLeft: `4px solid var(--${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'})` }}>
                  {rec}
                </li>
             ))}
           </ul>
        </div>
      </motion.div>

      {/* Tích hợp Load Mục tiêu */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <GoalTracker goals={[
           { name: 'Du Lịch Đà Nẵng', target: 30000000, current: 10000000, percent: 30 },
           { name: 'Quỹ Mua Xe', target: 50000000, current: 40000000, percent: 80 }
        ]} currency={currency} />
        
        {/* Bản đồ Heatmap (Giả lập đồ họa xịn) */}
        <div className="friendly-card" style={{ padding: '24px', marginTop: '24px' }}>
           <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Zap size={20} color="var(--danger)" /> Radar HeatMap Vị Trí Vung Tiền
           </h3>
           <div style={{ width: '100%', height: '180px', background: 'url(https://miro.medium.com/v2/resize:fit:1400/1*C2mZtYkU308E7g4-zN8kGQ.png) center/cover', borderRadius: '16px', border: '1px solid var(--border-glass)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--danger-bg)', padding: '12px 24px', borderRadius: '24px', color: 'white', fontWeight: 'bold', border: '1px solid var(--danger)', backdropFilter: 'blur(4px)' }}>
                📍 Trung tâm TP. Hồ Chí Minh
              </div>
           </div>
        </div>
      </motion.div>

    </div>
  );
}
