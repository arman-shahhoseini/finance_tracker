// Utility functions for Persian/Farsi formatting

// Format number to Persian with thousand separators
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '۰';
  return new Intl.NumberFormat('fa-IR').format(num);
};

// Format currency in Rial
export const formatRial = (amount) => {
  if (amount === null || amount === undefined) return '۰ ریال';
  return `${formatNumber(amount)} ریال`;
};

// Format currency in Toman
export const formatToman = (amount) => {
  if (amount === null || amount === undefined) return '۰ تومان';
  return `${formatNumber(Math.floor(amount / 10))} تومان`;
};

// Get current Jalali date
export const getCurrentJalaliDate = () => {
  const now = new Date();
  const options = { calendar: 'persian' };
  const formatter = new Intl.DateTimeFormat('fa-IR', options);
  const parts = formatter.formatToParts(now);
  
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
};

// Convert Persian digits to English
export const persianToEnglish = (str) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
};

// Convert English digits to Persian
export const englishToPersian = (str) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(i.toString(), 'g'), persianDigits[i]);
  }
  return result;
};

// Format Jalali date for display
export const formatJalaliDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthName = months[monthIndex] || '';
  
  return `${englishToPersian(parts[2])} ${monthName} ${englishToPersian(parts[0])}`;
};

// Get Jalali month name
export const getJalaliMonthName = (monthNumber) => {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return months[monthNumber - 1] || '';
};
