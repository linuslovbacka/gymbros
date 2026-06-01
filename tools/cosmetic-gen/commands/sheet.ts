// `gen sheet <target> [--clip idle,flex]` — (re)pack already-generated approved
// cutout frames into a fresh spritesheet + atlas WITHOUT calling the model. Useful
// after tweaking fps/frame selection or recovering a sheet. Writes a new version.

import { admin } from '../lib/supabase.ts';
import { download, nextVersion, upload } from '../lib/storage.ts';
import { packSheet, type PackClip } from '../lib/sheet.ts';
import { recordImage } from '../lib/versioning.ts';
import { CLIP_FPS, type ClipName } from '../prompts/clips.ts';
import { log } from '../lib/log.ts';

function prefixForTarget(target: string): string {
  const p = target.split(':');
  if (p[0] === 'avatar') return `${p[1]}/${p[2]}`;
  if (p[0] === 'bake') return `bakes/${p[1]}/${p[2]}/${p[3]}`;
  if (p[0] === 'effect') return `effects/vortex/${p[2]}`;
  throw new Error(`Repack not supported for target kind "${p[0]}".`);
}

export async function sheetCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const target = positional[0];
  if (!target) throw new Error('Usage: gen sheet <target> [--clip idle,flex]');
  const wantClips = ((flags.clip as string) ?? 'idle,flex').split(',').map((c) => c.trim()) as ClipName[];

  const { data: pv } = await admin
    .from('prompt_versions').select('id, version').eq('target', target)
    .order('version', { ascending: false }).limit(1).maybeSingle();
  if (!pv) throw new Error(`No prompt versions for "${target}".`);

  const { data: cutImgs } = await admin
    .from('generated_images')
    .select('clip, frame_index, storage_path')
    .eq('prompt_version_id', pv.id).eq('variant', 'cutout')
    .order('frame_index', { ascending: true });
  if (!cutImgs || cutImgs.length === 0) throw new Error(`No cutout frames archived for "${target}" v${pv.version}.`);

  const clips: PackClip[] = [];
  for (const clipName of wantClips) {
    const rows = cutImgs.filter((i) => (i.clip as string) === clipName);
    if (rows.length === 0) continue;
    const frames = await Promise.all(rows.map((r) => download(r.storage_path as string)));
    clips.push({ name: clipName, fps: CLIP_FPS[clipName], frames });
  }
  if (clips.length === 0) throw new Error('None of the requested clips had frames.');

  const { sheet, atlas } = await packSheet(clips);
  const prefix = prefixForTarget(target);
  const v = await nextVersion(prefix);
  const sheetPath = `${prefix}/v${v}/sheet.png`;
  await upload(sheetPath, sheet, 'image/png');
  await upload(`${prefix}/v${v}/sheet.json`, Buffer.from(JSON.stringify(atlas, null, 2)), 'application/json');
  const id = await recordImage({
    promptVersionId: pv.id as string, variant: 'spritesheet', storagePath: sheetPath,
    width: atlas.frameWidth, height: atlas.frameHeight, atlas,
  });

  log.ok(`repacked → ${sheetPath}`);
  log.info(`approve it:  npm run gen -- approve ${id} --player <slug>`);
}
