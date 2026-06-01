// Versioned uploads to the public `avatars` bucket (§7). Every regeneration writes
// to a NEW v{n} prefix; old versions are never overwritten. The app resolves the
// approved version via DB pointers, so accumulating history never affects players.

import { admin } from './supabase.ts';
import { CONFIG } from './env.ts';

const bucket = () => admin.storage.from(CONFIG.avatarsBucket());

/** Next v{n} under a prefix (e.g. "avatars/linus/tier1") by scanning existing folders. */
export async function nextVersion(prefix: string): Promise<number> {
  const { data, error } = await bucket().list(prefix, { limit: 1000 });
  if (error) throw new Error(`Storage list failed for "${prefix}": ${error.message}`);
  let max = 0;
  for (const entry of data ?? []) {
    const m = /^v(\d+)$/.exec(entry.name);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export async function upload(path: string, body: Buffer, contentType: string): Promise<string> {
  const { error } = await bucket().upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(`Upload failed for "${path}": ${error.message}`);
  return path;
}

export function publicUrl(path: string): string {
  return bucket().getPublicUrl(path).data.publicUrl;
}

export async function download(path: string): Promise<Buffer> {
  const { data, error } = await bucket().download(path);
  if (error || !data) throw new Error(`Download failed for "${path}": ${error?.message ?? 'no data'}`);
  return Buffer.from(await data.arrayBuffer());
}
