import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

// 添加版本号注释到打包文件
const dist = path.join(__dirname, '../dist');
const files = fs.readdirSync(dist).filter((f) => f.endsWith('.js') || f.endsWith('.cjs'));

files.forEach((file) => {
  const filePath = path.join(dist, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const banner = `/**\n * ${pkg.name} v${pkg.version}\n * (c) ${new Date().getFullYear()} ${
    pkg.author
  }\n * Released under the ${pkg.license} License.\n */\n`;
  fs.writeFileSync(filePath, banner + content);
});

// 复制README和LICENSE到dist
['README.md', 'LICENSE'].forEach((file) => {
  fs.copyFileSync(path.join(__dirname, '..', file), path.join(dist, file));
});
