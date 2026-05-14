const fs = require('fs');
const content = fs.readFileSync('/Users/apple/Documents/Projects/Plas-dash/src/components/shop/EditStaffDialog.tsx', 'utf8');

let braces = 0;
let parens = 0;
let curlies = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') curlies++;
  if (content[i] === '}') curlies--;
  if (content[i] === '(') parens++;
  if (content[i] === ')') parens--;
  if (content[i] === '[') braces++;
  if (content[i] === ']') braces--;
}

console.log('Curlies:', curlies);
console.log('Parens:', parens);
console.log('Braces:', braces);
