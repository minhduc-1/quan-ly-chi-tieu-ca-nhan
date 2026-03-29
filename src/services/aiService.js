import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateAIResponse = async (prompt, _apiKey, context, _previousMessages = []) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { totalIncome, totalExpense, currentBalance, currency } = context;
      const fmt = (num) => new Intl.NumberFormat('vi-VN').format(Math.abs(num)) + 'đ';
      const msg = prompt.toLowerCase();
      
      if(msg.includes('chào') || msg.includes('hello')) return resolve(`Chào cậu! Số dư của cậu đang là ${fmt(currentBalance)}. Cậu muốn kiểm tra khoản chi tiêu nào không? 😊`);
      if(msg.includes('tiêu') || msg.includes('chi')) {
         if (totalExpense < 0) return resolve(`Cậu đã chỉ tiêu tổng cộng ${fmt(totalExpense)} trong tháng này. Khá là ổn đấy! Hãy tiếp tục duy trì nhé! 💪`);
         return resolve(`Cậu chưa có khoản chi tiêu nào hôm nay. Thật tuyệt vời vì biết cách tiết kiệm! 🌟`);
      }
      if(msg.includes('thu') || msg.includes('tiền vào') || msg.includes('nhận')) return resolve(`Tuyệt! Tổng thu nhập của cậu đang ở mức ${fmt(totalIncome)}. Tích tiểu thành đại nhé!`);
      if(msg.includes('còn lại') || msg.includes('tổng số') || msg.includes('số dư')) return resolve(`Dựa trên sổ cái, số dư thực tế ngay lúc này của cậu là ${fmt(currentBalance)}. 💸 Mình luôn túc trực ở đây nếu cậu cần đối soát nà.`);
      
      resolve(`Mình là AI quản lý dòng tiền của riêng cậu! (Hiện đây là chế độ Demo nhé). Theo dữ liệu, tài khoản cậu đang còn ${fmt(currentBalance)}. Cậu nhớ ghi chú chi tiêu đầy đủ nha. 🤖`);
    }, 1500); // Thêm độ trễ 1.5s giả vờ như đang lấy dữ liệu AI
  });
};
