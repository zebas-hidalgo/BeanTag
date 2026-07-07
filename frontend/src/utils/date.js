export const formatLocalDateStr = (dateStr, shortMonth = false) => {
  if (!dateStr) return 'Sin fecha';
  const cleanDate = dateStr.split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const monthsShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthIdx = parseInt(m, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  
  if (shortMonth) {
    return `${parseInt(d, 10)} ${monthsShort[monthIdx]}`;
  }
  return `${parseInt(d, 10)} ${monthsShort[monthIdx]} ${y}`;
};
