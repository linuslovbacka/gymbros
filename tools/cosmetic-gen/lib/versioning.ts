// Append-only archival bookkeeping (§7). Every run snapshots the EXACT resolved
// prompt into prompt_versions and every produced image into generated_images.
// Nothing is ever updated except the is_approved flag and the current pointers.

import { admin } from './supabase.ts';
import type { AtlasMeta } from './sheet.ts';

export type PromptKind = 'avatar' | 'cosmetic' | 'effect' | 'bake';

export interface RecordPromptArgs {
  kind: PromptKind;
  /** Groups all versions of one subject, e.g. "avatar:linus:tier1". */
  target: string;
  resolvedPrompt: string;
  params?: Record<string, unknown>;
  baseImageId?: string | null;
  model?: string;
  notes?: string;
}

export interface PromptVersionRow { id: string; version: number }

/** Insert a new prompt version with version = max(existing) + 1 for the subject. */
export async function recordPromptVersion(args: RecordPromptArgs): Promise<PromptVersionRow> {
  const { data: prev } = await admin
    .from('prompt_versions')
    .select('version')
    .eq('kind', args.kind)
    .eq('target', args.target)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = ((prev?.version as number | undefined) ?? 0) + 1;

  const { data, error } = await admin
    .from('prompt_versions')
    .insert({
      kind: args.kind,
      target: args.target,
      version,
      resolved_prompt: args.resolvedPrompt,
      params: args.params ?? {},
      base_image_id: args.baseImageId ?? null,
      model: args.model ?? null,
      notes: args.notes ?? null,
    })
    .select('id, version')
    .single();
  if (error) throw new Error(`recordPromptVersion failed: ${error.message}`);
  return data as PromptVersionRow;
}

export type Variant =
  | 'raw' | 'cutout' | 'frame' | 'spritesheet' | 'standalone' | 'layer' | 'special' | 'effect';

export interface RecordImageArgs {
  promptVersionId: string;
  variant: Variant;
  storagePath: string;
  clip?: string | null;
  frameIndex?: number | null;
  width?: number | null;
  height?: number | null;
  atlas?: AtlasMeta | null;
  approved?: boolean;
}

export async function recordImage(args: RecordImageArgs): Promise<string> {
  const { data, error } = await admin
    .from('generated_images')
    .insert({
      prompt_version_id: args.promptVersionId,
      variant: args.variant,
      clip: args.clip ?? null,
      frame_index: args.frameIndex ?? null,
      storage_path: args.storagePath,
      width: args.width ?? null,
      height: args.height ?? null,
      atlas: args.atlas ?? null,
      is_approved: args.approved ?? false,
    })
    .select('id')
    .single();
  if (error) throw new Error(`recordImage failed: ${error.message}`);
  return (data as { id: string }).id;
}

export async function setApproved(imageId: string, approved: boolean): Promise<void> {
  const { error } = await admin.from('generated_images').update({ is_approved: approved }).eq('id', imageId);
  if (error) throw new Error(`setApproved failed: ${error.message}`);
}

export interface VersionInfo {
  id: string;
  version: number;
  kind: string;
  target: string;
  resolved_prompt: string;
  created_at: string;
}

export async function listVersions(target?: string): Promise<VersionInfo[]> {
  let q = admin.from('prompt_versions').select('id, version, kind, target, resolved_prompt, created_at');
  if (target) q = q.eq('target', target);
  const { data, error } = await q.order('target').order('version', { ascending: true });
  if (error) throw new Error(`listVersions failed: ${error.message}`);
  return (data ?? []) as VersionInfo[];
}

export async function getImage(imageId: string) {
  const { data, error } = await admin
    .from('generated_images')
    .select('id, variant, clip, storage_path, prompt_version_id, is_approved')
    .eq('id', imageId)
    .maybeSingle();
  if (error) throw new Error(`getImage failed: ${error.message}`);
  return data;
}

export async function getPromptVersion(id: string) {
  const { data, error } = await admin
    .from('prompt_versions')
    .select('id, kind, target, version, resolved_prompt')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getPromptVersion failed: ${error.message}`);
  return data;
}
