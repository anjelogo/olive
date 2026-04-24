import { BucketKey } from "./bucketDataset";

export interface CompiledChunk {
  name: string;
  keywords: string[];
  regexPatterns: string[];
}

// discord caps keyword rules at 6/guild (free tier), 1000 keywords/rule, 10 regex/rule
const MAX_CHUNKS = 6;
const MAX_KEYWORDS_PER_CHUNK = 1000;

// fixed structural detectors per bucket: appended to chunk 0 only
const STRUCTURAL_PATTERNS: Record<BucketKey, string[]> = {
  contact: [
    "[\\w.+\\-]+@[\\w\\-]+\\.[\\w.]{2,}",
    "\\+?[\\d][\\d\\s()\\-\\.]{6,}\\d",
  ],
  giveaway: [
    "https?:\\/\\/[^\\s]+",
    "discord\\.(gg|com\\/invite)\\/[\\w\\-]+",
  ],
  payment: [
    "https?:\\/\\/[^\\s]+",
  ],
  spam: [
    "https?:\\/\\/[^\\s]+",
    "discord\\.(gg|com\\/invite)\\/[\\w\\-]+",
  ],
};

export function compileBucket(bucket: BucketKey, phrases: string[]): CompiledChunk[] {
  const deduped = [...new Set(phrases.map(p => p.toLowerCase().trim()))].filter(Boolean);
  const structural = STRUCTURAL_PATTERNS[bucket];
  const chunks: CompiledChunk[] = [];

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const keywords = deduped.slice(i * MAX_KEYWORDS_PER_CHUNK, (i + 1) * MAX_KEYWORDS_PER_CHUNK);

    // always emit chunk 0 even when no keywords (structural patterns still need a rule)
    if (keywords.length === 0 && i > 0) break;

    chunks.push({
      name: `olive:${bucket}:${String(i).padStart(2, "0")}`,
      keywords,
      regexPatterns: i === 0 ? structural : [],
    });

    if ((i + 1) * MAX_KEYWORDS_PER_CHUNK >= deduped.length) break;
  }

  return chunks;
}
