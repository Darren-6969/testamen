function normalizeNumber(num = '', sourceType = 'mssql') {
  const value = String(num || '').trim();
  if (sourceType === 'mssql' && value.startsWith('60')) {
    return value.slice(2);
  }
  return value;
}

function detectSubs(number) {
  const rules = [
    ['1300', 4], ['1800', 4], ['1700', 4], ['6189', 4],
    ['00', 4],
    ['100', 3], ['103', 3],
    ['08', 3],
    ['01', 2], ['02', 2], ['03', 2], ['04', 2],
    ['05', 2], ['06', 2], ['07', 2], ['09', 2]
  ];

  for (const [prefix, len] of rules) {
    if (number.startsWith(prefix)) {
      return number.slice(0, len);
    }
  }
  return '082'; // default
}

function secondsToHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

module.exports = { normalizeNumber, detectSubs, secondsToHMS };
