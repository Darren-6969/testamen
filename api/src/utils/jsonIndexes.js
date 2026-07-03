function indexBy(array, key) {
  const map = Object.create(null);
  for (const row of array) {
    map[row[key]] = row;
  }
  return map;
}

function groupBy(array, key) {
  const map = Object.create(null);
  for (const row of array) {
    (map[row[key]] ||= []).push(row);
  }
  return map;
}

module.exports = { indexBy, groupBy };
