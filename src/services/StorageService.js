import CryptoJS from 'crypto-js';

const SECRET_KEY = 'smart_expense_secret_2026_super_secure';

export const saveData = (key, data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.error('Lỗi mã hoá dữ liệu hệ thống', e);
  }
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
