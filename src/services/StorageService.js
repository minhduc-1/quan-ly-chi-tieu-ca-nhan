import CryptoJS from 'crypto-js';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const SECRET_KEY = 'smart_expense_secret_2026_super_secure';

export const saveData = (key, data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
    
    // Gắn động cơ Upload lên đám mây tĩnh lặng (Background Data Push)
    if (db) triggerCloudPush();
    
  } catch (e) {
    console.error('Lỗi mã hoá dữ liệu hệ thống', e);
  }
};

let pushTimeout = null;
const triggerCloudPush = () => {
   if (pushTimeout) clearTimeout(pushTimeout);
   pushTimeout = setTimeout(async () => {
      try {
         const GLOBAL_DOC_KEYS = ['users_db', 'tx_data', 'goals_data', 'debts_data', 'journals_data', 'groups_data', 'group_tx_data', 'trash_data', 'system_broadcast', 'broadcast_receipts', 'audit_logs', 'system_categories'];
         
         const payload = {};
         GLOBAL_DOC_KEYS.forEach(k => {
             const raw = localStorage.getItem(k);
             if(raw) payload[k] = raw;
         });
         
         // Sinh mốc thời gian duy nhất cho lần đồng bộ này
         const newRevision = Date.now();
         payload.lastUpdated = newRevision;
         
         // PHẢI cắm cờ tại máy Local trước khi bắn lên để Mạng Màng Lọc onSnapshot của chính máy mình không tự Reload!
         localStorage.setItem('cloud_last_synced', newRevision);
         
         await setDoc(doc(db, "smart_expense", "v6_global_state"), payload);
         console.log("☁ Upload Đám mây thành công lúc", new Date().toLocaleTimeString());
      } catch (err) {
         console.warn("Lỗi PUSH dữ liệu lên Mạng. (Data của bạn vẫn an toàn trên Máy).", err);
      }
   }, 2000); 
};

export const loadData = (key, defaultData) => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return defaultData;
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (e) {
    console.warn('Lỗi giải mã: Khóa sai hoặc dữ liệu nguyên thuỷ chưa mã hoá. Đang bỏ qua...');
    return defaultData;
  }
};

// Lắng nghe tín hiệu Nếu Thiết Bị Khác cập nhật (Điện thoại <-> Máy tính)
export const initCloudSyncListener = (onSyncReady) => {
    if (!db) {
        if(onSyncReady) onSyncReady(); // Nếu App chạy LocalOffline, Load ngay lập tức
        return; 
    }
    
    const docRef = doc(db, "smart_expense", "v6_global_state");
    onSnapshot(docRef, (snap) => {
        if(snap.exists()) {
             const data = snap.data();
             const localRevision = Number(localStorage.getItem('cloud_last_synced') || 0);

             // So sánh mã Revision tuyệt đối (Bỏ qua sai lệch Múi Giờ)
             if (data.lastUpdated && data.lastUpdated !== localRevision) { 
                 console.log("☁ [CLOUDSYNC] Tải Dữ liệu mới...");
                 
                 Object.keys(data).forEach(k => {
                     if (k !== 'lastUpdated') {
                        localStorage.setItem(k, data[k]); 
                     }
                 });
                 // Đồng bộ mốc Revision máy mình với Máy Chủ
                 localStorage.setItem('cloud_last_synced', data.lastUpdated);
                 
                 // Áp dụng Cập nhật Xong -> Bắt Lõi App React Tải Lại ngay
                 window.location.reload(); 
                 return; // Ngắt luồng Code tại đây, Tải lại giao diện.
             }
        } else {
             // Lần chạy đầu tiên của Máy mới toanh khi Server chưa có data
             if(!localStorage.getItem('cloud_last_synced')) {
                localStorage.setItem('cloud_last_synced', Date.now());
             }
        }
        
        // Mở Khóa Giao Diện (Screen Loader biến mất)
        if(onSyncReady) onSyncReady(); 
    }, (error) => {
        console.warn("Mất kết nối Radar Đám Mây. Tự rơi về Offline Mode.", error);
        if(onSyncReady) onSyncReady();
    });
};
