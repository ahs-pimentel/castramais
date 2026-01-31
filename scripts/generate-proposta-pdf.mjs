import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

const htmlPath = path.resolve(__dirname, '../public/PROPOSTA-ODOIS.html');
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

await page.pdf({
  path: path.resolve(__dirname, '../public/PROPOSTA-ODOIS.pdf'),
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});

await browser.close();
console.log('PDF gerado com sucesso: public/PROPOSTA-ODOIS.pdf');
