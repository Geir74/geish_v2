/*
 * Manifest content-API.
 *
 * Leser src/content/manifest.mdx, parser frontmatter med gray-matter,
 * validerer med zod, utleder lese-tid via blog-pipelinens deriveReadTime.
 *
 * Mindre overflate enn blog-API — én kjent fil, ett frontmatter-felt.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { deriveReadTime } from "@/lib/blog/reading-time";

// MERK: gray-matter auto-konverterer YAML-datoer til JS Date — samme quirk
// som blog-schema håndterer. Aksepterer begge og normaliserer til ISO-string.
const manifestFrontmatterSchema = z.object({
  lastUpdated: z
    .union([z.string(), z.date()])
    .transform((v, ctx) => {
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `lastUpdated must be YYYY-MM-DD (got "${v}")`,
        });
        return z.NEVER;
      }
      return v;
    }),
});

export interface ManifestData {
  lastUpdated: string;
  readTimeMin: number;
  mdxSource: string;
}

export async function getManifest(): Promise<ManifestData> {
  const filePath = path.join(process.cwd(), "src/content/manifest.mdx");
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = manifestFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid frontmatter in src/content/manifest.mdx:\n${issues}`,
    );
  }

  return {
    lastUpdated: result.data.lastUpdated,
    readTimeMin: deriveReadTime(content),
    mdxSource: content,
  };
}
