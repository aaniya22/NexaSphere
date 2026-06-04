export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((val) => {
          let str = String(val === null || val === undefined ? '' : val);
          // Sanitize CSV Formula Injection (prefix with single quote if starts with =, +, -, @)
          if (
            str.startsWith('=') ||
            str.startsWith('+') ||
            str.startsWith('-') ||
            str.startsWith('@')
          ) {
            str = `'${str}`;
          }
          // Escape double quotes and wrap in quotes if contains comma
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
