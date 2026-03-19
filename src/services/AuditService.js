import { saveData, loadData } from './StorageService';

export const logAction = (userEmail, action, details) => {
  const logs = loadData('audit_logs', []);
  const newLog = {
    id: Date.now(),
    timestamp: new Date().toLocaleString('vi-VN'),
    user: userEmail || 'Khách / Hệ thống',
    action,
    details
  };
  // Giới hạn 1000 log gần nhất để tránh đầy bộ nhớ trình duyệt
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  saveData('audit_logs', updatedLogs);
};

export const getLogs = () => {
  return loadData('audit_logs', []);
};
