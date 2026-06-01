// `gen list [target]` — show all prompt versions (optionally one subject), with
// each version's approved image ids so you know what you can approve / roll back to.

import { admin } from '../lib/supabase.ts';
import { listVersions } from '../lib/versioning.ts';
import { log } from '../lib/log.ts';

export async function listCmd(positional: string[]): Promise<void> {
  const target = positional[0];
  const versions = await listVersions(target);
  if (versions.length === 0) {
    log.warn(target ? `No versions for "${target}".` : 'No prompt versions yet.');
    return;
  }

  const ids = versions.map((v) => v.id);
  const { data: images } = await admin
    .from('generated_images')
    .select('id, prompt_version_id, variant, clip, is_approved, storage_path')
    .in('prompt_version_id', ids)
    .order('created_at', { ascending: true });

  const byPv = new Map<string, typeof images>();
  for (const img of images ?? []) {
    const k = img.prompt_version_id as string;
    if (!byPv.has(k)) byPv.set(k, [] as unknown as typeof images);
    byPv.get(k)!.push(img);
  }

  let lastTarget = '';
  for (const v of versions) {
    if (v.target !== lastTarget) { console.log(`\n${v.target}`); lastTarget = v.target; }
    const imgs = byPv.get(v.id) ?? [];
    const sheets = imgs.filter((i) => ['spritesheet', 'standalone', 'special', 'effect'].includes(i.variant as string));
    log.info(`v${v.version}  ${v.created_at.slice(0, 19).replace('T', ' ')}  (${imgs.length} images)`);
    for (const s of sheets) {
      const mark = s.is_approved ? '★ APPROVED' : '  ';
      log.dim(`${mark}  ${s.id}  ${s.variant}${s.clip ? `/${s.clip}` : ''}  ${s.storage_path}`);
    }
  }
}
