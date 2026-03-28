import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateAIResponse = async (prompt, apiKey, context, previousMessages = []) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemInstruction = 
      "Bạn là trợ lý tài chính thông minh của ứng dụng Smart Expense Tracker. " +
      "Nhiệm vụ của bạn là phân tích dữ liệu giao dịch của người dùng và đưa ra lời khuyên tài chính, nhắc nhở chi tiêu một cách chính xác khoa học. " +
      "Bạn phải trả lời ngắn gọn, súc tích (dưới 150 chữ), xưng hô thân mật là 'mình' và 'cậu', dùng biểu tượng cảm xúc (emoji) cho sinh động. " +
      "Không được sáng tác ra các con số không có trong dữ liệu do người dùng cung cấp." +
      "Nếu người dùng hỏi những câu ngoài lề không liên quan tới tài chính/app, hãy lịch sự từ chối và hướng họ quay lại chủ đề tiền bạc.";

    // Lấy model. Chỉ định systemInstruction nếu model hỗ trợ (VD: gemini-1.5-flash)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
         temperature: 0.4, // Giữ câu trả lời ổn định không quá phiêu
         maxOutputTokens: 250,
      }
    });

    const { totalIncome, totalExpense, currentBalance, currency } = context;
    const financialContext = `
[BỐI CẢNH TÀI CHÍNH HIỆN TẠI TỪ HỆ THỐNG APP]:
- Tổng thu nhập trên hệ thống: ${totalIncome} ${currency}
- Tổng chi tiêu trên hệ thống: ${totalExpense} ${currency}
- Số dư khả dụng thực tế: ${currentBalance} ${currency}

(Lưu ý: Bạn là hệ thống Smart Expense V5 được kết nối AI. Chỉ phân tích dựa trên bối cảnh trên nếu người dùng hỏi về tiền của họ).

[CÂU HỎI CỦA NGƯỜI DÙNG]: ${prompt}
`;

    // Chuẩn bị lịch sử hội thoại cho AI để nó nhớ ngữ cảnh
    const formattedHistory = previousMessages
      // Loại trừ tin nhắn "chào mừng" tự động hoặc yêu cầu nhập key ban đầu để tránh nhiễu
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
       }));

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(financialContext);
    return result.response.text();

  } catch (error) {
    console.error("AI Service Error:", error);
    
    if (error.message?.includes("API key not valid")) {
      return "❌ Khóa API Key cậu vừa nhập không hợp lệ hoặc đã bị khóa. Cậu kiểm tra lại mã ở Google AI Studio nhé!";
    }
    if (error.message?.includes("permission denied")) {
       return "❌ Khóa API Key này không có quyền truy cập, có thể do lỗi giới hạn vùng/region. Khuyên cậu dùng VPN khi gọi API nếu mạng chặn.";
    }
    
    return "⚠️ Oops! Não bộ AI của mình đang gặp gián đoạn kĩ thuật hoặc do lỗi mạng. Cậu thử hỏi lại mình sau vài phút nhé!";
  }
};
