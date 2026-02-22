const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.replace(/[<>]/g, '').trim();
  }
  return input;
};

const formatDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate,
    endDate,
  };
};

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

module.exports = {
  sanitizeInput,
  formatDateRange,
  getCurrentSeason,
};
