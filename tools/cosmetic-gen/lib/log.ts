// Tiny console helpers so the manual run loop is readable.

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
};

export const log = {
  step: (m: string) => console.log(`${C.cyan}${C.bold}» ${m}${C.reset}`),
  info: (m: string) => console.log(`  ${m}`),
  dim: (m: string) => console.log(`${C.dim}  ${m}${C.reset}`),
  ok: (m: string) => console.log(`${C.green}✓ ${m}${C.reset}`),
  warn: (m: string) => console.log(`${C.yellow}! ${m}${C.reset}`),
  err: (m: string) => console.error(`${C.red}✗ ${m}${C.reset}`),
};
