export function validateDataIntegrity(data = []) {
  const duplicates = [];
  const seen = new Set();

  data.forEach((item) => {
    const key = item.id || item.email;

    if (!key) return;

    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  });

  return {
    totalRecords: data.length,
    duplicateCount: duplicates.length,
    duplicates,
    valid: duplicates.length === 0,
  };
}