const { execSync } = require('child_process');
try {
  const result = execSync('curl -s https://raw.githubusercontent.com/slovensko-digital/uvostat/master/doc/api.md | head -n 40').toString();
  console.log(result);
} catch (e) {
  console.log('failed');
}
