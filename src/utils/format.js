export const formatCurrency = (amount, currency = 'VND') => {
  if (currency === 'USD') {
    const usd = amount / 25000;
    return '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return amount.toLocaleString('vi-VN') + ' đ';
};
