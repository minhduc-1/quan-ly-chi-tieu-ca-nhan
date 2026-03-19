export default function SmartInsights({ transactions }) {
  const totalFood = transactions.filter(tx => tx.category === 'Ăn uống').reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontWeight: '600' }}>
        <span style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: 'var(--accent-purple)' }}>🧠</span> 
        Trợ lý Tài chính
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {totalFood > 1000000 ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--accent-red)', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0', transition: 'all 0.3s' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>Bạn đã chi <strong>{totalFood.toLocaleString('vi-VN')} đ</strong> cho Ăn uống. Chú ý nguy cơ vượt ngân sách tuần này!</p>
          </div>
        ) : (
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid var(--accent-green)', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0', transition: 'all 0.3s' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>Vẫn đang duy trì tốt ngân sách ăn uống ({totalFood.toLocaleString('vi-VN')} đ).</p>
          </div>
        )}
        
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid var(--accent-blue)', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>Dữ liệu tháng này cho thấy bạn đang chi tiêu ít hơn <strong>12%</strong> so với tháng trước. Đáng khen ngợi!</p>
        </div>
      </div>
    </div>
  );
}
