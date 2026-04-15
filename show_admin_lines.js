const fs = require('fs');
const path = 'components/admin/AdminWorkspace.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
for (let i = 1038; i < 1078 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
