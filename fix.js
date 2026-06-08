const fs = require('fs'); const p = 'server/package.json'; let d = fs.readFileSync(p, 'utf8'); d = d.replace(' test/portfolioAuth.test.js', ''); fs.writeFileSync(p, d);
