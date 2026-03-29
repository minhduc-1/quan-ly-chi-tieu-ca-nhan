import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// CHÚ Ý DÀNH CHO BẠN (SINH VIÊN ĐANG LÀM ĐỒ ÁN):
// Hãy xóa bảng firebaseConfig giả dưới đây, dán bảng Thật của bạn lấy từ Google Firebase vào vị trí này.
// Vị trí: console.firebase.google.com -> Web App.
// Nếu cài chuẩn, App TỰ ĐỘNG nâng cấp thành App Cloud (Tạo nick trên máy này, máy khác đăng nhập được).
// Nếu chưa dán hoặc dán sai, App vẫn tiếp tục chạy hoàn hảo dưới dạng Local Offline thông thường.

const firebaseConfig = {
  apiKey: "AIzaSyA_wbQKsvOyDe3gFpe-b5Q2MkuS3WITBj8",
  authDomain: "do-an-tot-nghiep-2e56d.firebaseapp.com",
  projectId: "do-an-tot-nghiep-2e56d",
  storageBucket: "do-an-tot-nghiep-2e56d.firebasestorage.app",
  messagingSenderId: "1023721035228",
  appId: "1:1023721035228:web:70a5d6a210443fbb7beb19",
  measurementId: "G-99GY7R0JK3"
};

let app, db = null;

try {
  // Chỉ cài đặt Đám mây khi sinh viên đã dán API Key thật:
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.length > 20) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log("🟢 FIREBASE CLOUD SYSTEM: KẾT NỐI THÀNH CÔNG");
  } else {
      console.warn("🟡 FIREBASE CLOUD SYSTEM: Tắt (Đang chạy ở chế độ Cục Bộ LocalStorage)");
  }
} catch (error) {
  console.error("Lỗi Khởi tạo Cầu Ghép Firebase: ", error);
}

export { db };
