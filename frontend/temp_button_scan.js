const fs = require('fs');
const path = require('path');
const re = /<button\b([^>]*)>/gi;
const root = path.join(__dirname, 'src');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      const text = fs.readFileSync(p, 'utf8');
      let m;
      while ((m = re.exec(text))) {
        const attrs = m[1];
        if (attrs.includes('onClick') || attrs.includes('onSubmit') || attrs.includes('type="submit"') || attrs.includes("type='submit'")) continue;
        const line = text.slice(0, m.index).split('\n').length;
        console.log(`${path.relative(__dirname, p)}:${line}:${attrs.trim()}`);
      }
    }
  }
}
walk(root);
