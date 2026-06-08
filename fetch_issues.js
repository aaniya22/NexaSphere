const https = require('https');

function fetch(url, cb) {
  https.get(url, { headers: { 'User-Agent': 'node.js', 'Accept': 'application/vnd.github.v3+json' } }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => cb(JSON.parse(data)));
  });
}

[1023, 1024, 1025].forEach(id => {
  fetch('https://api.github.com/repos/Ayushh-Sharmaa/NexaSphere/issues/' + id, data => {
    console.log(`\n\n--- Issue ${id}: ${data.title} ---`);
    console.log(data.body);
  });
});
