// `gen diff <target> [vA vB]` — compare the resolved prompt text across versions
// of one subject (defaults to the two most recent). Line-by-line, additions/removals.

import { admin } from '../lib/supabase.ts';
import { log } from '../lib/log.ts';

async function promptAt(target: string, version?: number): Promise<{ version: number; text: string } | null> {
  let q = admin.from('prompt_versions').select('version, resolved_prompt').eq('target', target);
  if (version != null) q = q.eq('version', version);
  const { data } = await q.order('version', { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { version: data.version as number, text: data.resolved_prompt as string };
}

export async function diffCmd(positional: string[]): Promise<void> {
  const [target, aStr, bStr] = positional;
  if (!target) throw new Error('Usage: gen diff <target> [versionA versionB]');

  const { data: all } = await admin
    .from('prompt_versions').select('version').eq('target', target).order('version', { ascending: false });
  if (!all || all.length === 0) { log.warn(`No versions for "${target}".`); return; }

  const newer = aStr ? Number(aStr) : (all[0].version as number);
  const older = bStr ? Number(bStr) : (all[1]?.version as number | undefined);
  if (older == null) { log.warn('Only one version exists — nothing to diff.'); return; }

  const a = await promptAt(target, older);
  const b = await promptAt(target, newer);
  if (!a || !b) { log.err('Could not load both versions.'); return; }

  log.step(`diff ${target}: v${a.version} → v${b.version}`);
  const aLines = a.text.split('\n');
  const bLines = b.text.split('\n');
  const setA = new Set(aLines);
  const setB = new Set(bLines);
  for (const line of aLines) if (!setB.has(line)) console.log(`\x1b[31m- ${line}\x1b[0m`);
  for (const line of bLines) if (!setA.has(line)) console.log(`\x1b[32m+ ${line}\x1b[0m`);
  if (a.text === b.text) log.dim('(identical prompt text)');
}
