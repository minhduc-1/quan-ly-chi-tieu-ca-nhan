import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, ShieldCheck, Flame, HeartPulse, Target } from 'lucide-react';
import GoalTracker from './GoalTracker';

export default function SmartInsights({ transactions, goals, currency, onDeleteGoal }) {
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
      emotion = 'Cảnh báo vung tay';
      recommendations.push("Mức chi tiêu trong ngày vượt hạn mức an toàn. Cần siết chặt các khoản không thiết yếu!");
    } else if (dayTotal > 1000000 && isWeekend) {
      score -= 10;
      state = 'Lưu ý';
      emotion = 'Chi tiêu tự do';
      recommendations.push("Cuối tuần có dấu hiệu tăng mạnh chi phí. Hãy kiểm soát lại ngân sách 50%!");
    } else if (noSpendStreak > 0) {
       score += 10;
       emotion = 'Kỷ luật tài chính tốt';
       recommendations.push(`Rất tuyệt! Bạn đã duy trì được chuỗi ${noSpendStreak} ngày không phát sinh chi phí.`);
    }

    // Dynamic Month-over-Month logic
    const currentDate = new Date();
    const currentMonthTx = transactions.filter(t => t.amount < 0 && new Date(t.date).getMonth() === currentDate.getMonth());
    const prevMonthTx = transactions.filter(t => { 
        const d = new Date(t.date); 
        const pDate = new Date(); pDate.setMonth(pDate.getMonth() - 1);
        return t.amount < 0 && d.getMonth() === pDate.getMonth(); 
    });

    const currCategories = currentMonthTx.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); return acc; }, {});
    const prevCategories = prevMonthTx.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); return acc; }, {});

    Object.keys(currCategories).forEach(cat => {
        const currCatVal = currCategories[cat];
        const prevCatVal = prevCategories[cat] || 0;
        if (prevCatVal > 0) {
            const increase = ((currCatVal - prevCatVal) / prevCatVal) * 100;
            if (increase > 20 && currCatVal > 200000) {
                recommendations.push(`Bạn đang chi quá nhiều cho [${cat}] so với tháng trước (tăng ${increase.toFixed(0)}%). Hãy cẩn trọng!`);
            }
        } else if (currCatVal > 500000) {
             recommendations.push(`Khoản chi mới cho [ ${cat} ] đang khá cao. Bạn nên theo dõi ngân sách sát sao.`);
        }
    });
    
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
           <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'}) ${insight.score}%, var(--border-light) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--surface-opaque)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '28px', color: `var(--${insight.score >= 80 ? 'success' : insight.score >= 50 ? 'warning' : 'danger'})` }}>
                {insight.score}
             </div>
           </div>
           
           <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Thuật toán Tâm Lý (AI):</p>
              
              <div style={{ background: 'var(--surface-opaque)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Flame size={16} color="var(--warning)" />
                 <span style={{ fontSize: '14px', fontWeight: '600' }}>Hành vi tài chính: {insight.emotion}</span>
              </div>

              {insight.streak > 0 && (
                 <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                   🔥 Chuỗi Tiết Kiệm: {insight.streak} Ngày
                 </div>
              )}
           </div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
           <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <ShieldCheck size={16} /> Nhận định từ Trợ lý Phân tích
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

      {/* Tích hợp Load Mục tiêu Thực Tế */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="friendly-card" style={{ padding: '24px', border: '1px solid var(--border-light)' }}>
             <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
               <Target size={20} color="var(--primary)" /> Quản lý Mục tiêu Tài chính
             </h3>
             {goals.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '14px', background: 'var(--bg-app)', borderRadius: '12px' }}>
                   Hệ thống chưa ghi nhận mục tiêu nào.<br/>Vui lòng chia sẻ kế hoạch bằng cách "Thiết Lập Mục Tiêu".
                </div>
             ) : (
                <GoalTracker goals={goals} currency={currency} onDeleteGoal={onDeleteGoal} />
             )}
        </div>
        
        {/* Bản đồ Heatmap */}
        <div className="friendly-card" style={{ padding: '24px', marginTop: '24px' }}>
           <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Zap size={20} color="var(--danger)" /> Bản đồ Mật độ Chi tiêu
           </h3>
           <div style={{ width: '100%', height: '180px', background: 'url(https://miro.medium.com/v2/resize:fit:1400/1*C2mZtYkU308E7g4-zN8kGQ.png) center/cover', borderRadius: '16px', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)' }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--danger-bg)', padding: '12px 24px', borderRadius: '24px', color: 'var(--danger)', fontWeight: 'bold', border: '1px solid var(--danger)', backdropFilter: 'blur(4px)' }}>
                📍 Khu vực phát sinh cao điểm
              </div>
           </div>
        </div>
      </motion.div>

    </div>
  );
}
