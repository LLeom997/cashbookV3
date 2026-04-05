import * as fs from 'fs';

function parseCSVRow(text) {
    let result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuote = false;
                }
            } else {
                cur += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
    }
    result.push(cur);
    return result;
}

const file = fs.readFileSync('test.csv', 'utf8');

const lines = file.split('\n').filter(line => line.trim().length > 0);
const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
console.log('headers:', headers);

const getIdx = (name) => headers.findIndex(h => h === name.toLowerCase());
const cashInIdx = getIdx('cash in');
const cashOutIdx = getIdx('cash out');
const amountIdx = getIdx('amount');
const typeIdx = getIdx('type');

console.log('indices:', { cashInIdx, cashOutIdx, amountIdx, typeIdx });

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVRow(lines[i]);
  let amount = 0;
  let type = 'OUT';

  if (cashInIdx >= 0 && row[cashInIdx]?.trim()) {
    amount = parseFloat(row[cashInIdx].trim().replace(/[^0-9.-]+/g,""));
    if (amount > 0) type = 'IN';
  } else if (cashOutIdx >= 0 && row[cashOutIdx]?.trim()) {
    amount = parseFloat(row[cashOutIdx].trim().replace(/[^0-9.-]+/g,""));
    if (amount > 0) type = 'OUT';
  }

  console.log('row:', row);
  console.log('parsed type:', type, 'amount:', amount);
}
