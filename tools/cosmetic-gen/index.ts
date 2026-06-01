#!/usr/bin/env -S npx tsx
// Gymbros avatar/cosmetic generation CLI (generation-spec §9). Dev-run, manual,
// approval-gated. Run: npm run gen -- <command> [...args]
//
//   avatar <player> <tier> [--clip idle,flex] [--frames N]
//   cosmetic <slug> [--player linus]
//   bake <player> <tier> --loadout head=snapback,torso=tank_black [--clip ...] [--frames N] [--base path]
//   vortex <stage 1..5> [--frames N]
//   sheet <target> [--clip idle,flex]
//   list [target]
//   diff <target> [versionA versionB]
//   approve <imageId> [--player slug] [--profile uuid]

import { log } from './lib/log.ts';
import { avatarCmd } from './commands/avatar.ts';
import { cosmeticCmd } from './commands/cosmetic.ts';
import { bakeCmd } from './commands/bake.ts';
import { vortexCmd } from './commands/vortex.ts';
import { sheetCmd } from './commands/sheet.ts';
import { listCmd } from './commands/list.ts';
import { diffCmd } from './commands/diff.ts';
import { approveCmd } from './commands/approve.ts';

function parseArgs(argv: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const body = tok.slice(2);
      const eq = body.indexOf('=');
      if (eq >= 0) { flags[body.slice(0, eq)] = body.slice(eq + 1); continue; }
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { flags[body] = next; i++; } else { flags[body] = true; }
    } else {
      positional.push(tok);
    }
  }
  return { positional, flags };
}

const HELP = `Gymbros generation CLI — manual, approval-gated.

  npm run gen -- avatar <player> <tier> [--clip idle,flex] [--frames N]
  npm run gen -- cosmetic <slug> [--player linus]
  npm run gen -- bake <player> <tier> --loadout head=snapback,torso=tank_black
  npm run gen -- vortex <stage 1..5> [--frames N]
  npm run gen -- sheet <target> [--clip idle,flex]
  npm run gen -- list [target]
  npm run gen -- diff <target> [versionA versionB]
  npm run gen -- approve <imageId> [--player slug] [--profile uuid]
`;

type Handler = (positional: string[], flags: Record<string, string | boolean>) => Promise<void>;
const COMMANDS: Record<string, Handler> = {
  avatar: avatarCmd,
  cosmetic: cosmeticCmd,
  bake: bakeCmd,
  vortex: vortexCmd,
  sheet: sheetCmd,
  list: listCmd,
  diff: diffCmd,
  approve: approveCmd,
};

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === 'help' || command === '--help') { console.log(HELP); return; }
  const handler = COMMANDS[command];
  if (!handler) { log.err(`Unknown command "${command}".`); console.log(HELP); process.exitCode = 1; return; }
  const { positional, flags } = parseArgs(rest);
  await handler(positional, flags);
}

main().catch((err) => {
  log.err(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
