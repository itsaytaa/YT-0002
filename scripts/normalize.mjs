// Text normalisation and word error rate for the STT check.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below1000(n) {
  const out = [];
  if (n >= 100) {
    out.push(ONES[Math.floor(n / 100)], "hundred");
    n %= 100;
    if (n) out.push("and");
  }
  if (n >= 20) {
    out.push(TENS[Math.floor(n / 10)]);
    if (n % 10) out.push(ONES[n % 10]);
  } else if (n || !out.length) out.push(ONES[n]);
  return out;
}

export function numberToWords(n) {
  if (n === 0) return ["zero"];
  const out = [];
  if (n >= 1000) {
    out.push(...below1000(Math.floor(n / 1000)), "thousand");
    n %= 1000;
    if (n && n < 100) out.push("and");
  }
  if (n) out.push(...below1000(n));
  return out;
}

// Each numeric token can be read as a number ("four hundred and eleven") or digit by
// digit ("zero four one one"); both are valid spellings of what the voice said.
function expansions(token) {
  const digits = token.replace(/,/g, "");
  const asDigits = [...digits].map((d) => ONES[Number(d)]);
  const asNumber = numberToWords(Number(digits));
  const noLeadingZeros = [...(digits.replace(/^0+(?=\d)/, ""))].map((d) => ONES[Number(d)]);
  return [asNumber, asDigits, noLeadingZeros];
}

export function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w !== "and");
}

// All spellings of a text, as word arrays ("and" is dropped so "two thousand three
// hundred and sixteen" and "two thousand three hundred sixteen" compare equal).
export function variants(text) {
  let acc = [[]];
  for (const t of tokens(text)) {
    const opts = /^\d+$/.test(t) ? expansions(t).map((e) => e.filter((w) => w !== "and")) : [[t]];
    acc = acc.flatMap((a) => opts.map((o) => [...a, ...o])).slice(0, 64);
  }
  return acc;
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function wer(reference, hypothesis) {
  let best = Infinity;
  for (const r of variants(reference))
    for (const h of variants(hypothesis)) best = Math.min(best, editDistance(r, h) / Math.max(1, r.length));
  return best;
}
