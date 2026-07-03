const { normalizeNumber, detectSubs, secondsToHMS } = require('../utils/cdrUtils');

function emptyBucket() {
  return { calls: [], count: 0, duration: 0, total: 0 };
}

function classifyCall(subs) {
  if (subs === '082' || subs === '100' || subs === '1800') return 'local';
  if (subs === '01' || subs === '1700') return 'mobile';
  if (
    subs === '083' || subs === '084' || subs === '085' ||
    subs === '086' || subs === '087' || subs === '088' ||
    subs === '089' || subs === '02' || subs === '03' ||
    subs === '04' || subs === '05' || subs === '06' ||
    subs === '07' || subs === '09' || subs === '103'
  ) return 'trunk';

  // Legacy PHP logic treats 00-prefixed numbers as IDD by exclusion.
  if (subs.startsWith('00')) return 'international';

  return 'international';
}

function round2(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function formatDate(value) {
  if (!value) return '';
  const asString = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(asString)) {
    return asString.slice(0, 10);
  }

  const parsed = new Date(asString);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return asString.length >= 10 ? asString.slice(0, 10) : asString;
}

function formatTime(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  if (/^\d{1,6}$/.test(raw)) {
    const padded = raw.padStart(6, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
  }

  if (raw.includes(':')) {
    const parts = raw.split(':');
    const hh = (parts[0] || '0').padStart(2, '0');
    const mm = (parts[1] || '0').padStart(2, '0');
    const ss = (parts[2] || '0').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return raw;
}

function calculateStdRate(duration, rate) {
  if (!rate) return 0;

  const firstBlockSec = Number(rate.std_sec);
  const firstBlockRate = Number(rate.std_sec_rate);
  const nextBlockSec = Number(rate.std_sec_2);
  const nextBlockRate = Number(rate.std_sec_rate_2);

  if (nextBlockRate && duration > firstBlockSec) {
    const extra = Math.ceil((duration - firstBlockSec) / nextBlockSec);
    return round2(firstBlockRate + (extra * nextBlockRate));
  }

  return round2(Math.ceil(duration / firstBlockSec) * firstBlockRate);
}

function calculateIddRate(duration, rate) {
  if (!rate) {
    return 0;
  }
  return round2(Math.ceil(duration / rate.idd_sec) * rate.idd_rate);
}

async function buildPhoneCDR({
  phoneNumber,
  extension,
  plan,
  sourceType = 'mssql',
  calls,
  stdRates,
  iddRates
}) {
  const buckets = {
    local: emptyBucket(),
    trunk: emptyBucket(),
    mobile: emptyBucket(),
    international: emptyBucket()
  };

  for (const call of calls) {
    const to = normalizeNumber(call.to, sourceType);
    const subs = detectSubs(to);
    const duration = Number(call.duration || 0);
    const type = classifyCall(subs);

    let amount = 0;

    if (type === 'international') {
      const rate = iddRates.find(r => to.startsWith(r.idd_code));
      amount = calculateIddRate(duration, rate);
    } else {
      const rate = stdRates.find(r => r.std_code === subs);
      amount = calculateStdRate(duration, rate);
    }

    const bucket = buckets[type];
    bucket.calls.push({
      date: formatDate(call.date),
      to,
      time: formatTime(call.time),
      duration: secondsToHMS(duration),
      amount
    });

    bucket.count++;
    bucket.duration += duration;
    bucket.total = round2(bucket.total + amount);
  }

  return {
    phoneNumber,
    extension,
    plan,
    ...buckets,
    totalAmount: round2(
      buckets.local.total +
      buckets.trunk.total +
      buckets.mobile.total +
      buckets.international.total
    )
  };
}

module.exports = { buildPhoneCDR };
