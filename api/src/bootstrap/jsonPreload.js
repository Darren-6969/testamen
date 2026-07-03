const { loadJsonFast } = require('../utils/jsonLoader');

async function preloadJson() {
  console.time('JSON preload');

  await Promise.all([
    loadJsonFast('sy_profile.json'),
    loadJsonFast('ar_iv.json'),
    loadJsonFast('ar_ivdtl.json'),
    loadJsonFast('ar_customer.json'),
    loadJsonFast('ar_customerbranch.json'),
    loadJsonFast('ar_knockoff.json'),
    loadJsonFast('ar_pm.json'),
    loadJsonFast('ar_cn.json'),
    loadJsonFast('ar_dn.json'),
    // loadJsonFast('gl_trans.json'),
  ]);

  console.timeEnd('JSON preload');
}

module.exports = preloadJson;
