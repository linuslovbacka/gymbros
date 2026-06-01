// Gemini (Nanobanan Pro / Nano Banana) image generation wrapper. Text-to-image
// for frame 0 / standalone items; image-to-image (conditioned on one or more input
// images) for animation frames and loadout bakes — the consistency technique in §6.
//
// OPEN QUESTION (spec §12): exact model id + image-to-image support are confirmed on
// first real run. The model id is configurable via GEMINI_IMAGE_MODEL.

import { GoogleGenAI, Modality } from '@google/genai';
import { CONFIG } from './env.ts';

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey() });
  return client;
}

export interface GenImageOpts {
  /** Optional conditioning images (image-to-image). Frame 0 / current avatar etc. */
  inputImages?: Buffer[];
}

/** Generate a single PNG image. Returns the raw bytes (still has the gen background). */
export async function generateImage(prompt: string, opts: GenImageOpts = {}): Promise<Buffer> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const img of opts.inputImages ?? []) {
    parts.push({ inlineData: { mimeType: 'image/png', data: img.toString('base64') } });
  }

  const res = await ai().models.generateContent({
    model: CONFIG.geminiModel(),
    contents: [{ role: 'user', parts }],
    config: { responseModalities: [Modality.IMAGE] },
  });

  const candidate = res.candidates?.[0];
  const out = candidate?.content?.parts?.find((p) => p.inlineData?.data);
  const data = out?.inlineData?.data;
  if (!data) {
    const text = candidate?.content?.parts?.map((p) => p.text).filter(Boolean).join(' ') ?? '';
    throw new Error(`Gemini returned no image. ${text ? `Model said: ${text}` : 'Empty response.'}`);
  }
  return Buffer.from(data, 'base64');
}
