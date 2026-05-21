/*
 * Blog post frontmatter-skjema og typer.
 *
 * Bruker zod for runtime-validering ved fil-read. Ugyldig/manglende felt
 * kaster en feil med tydelig melding ved første parsing — typisk build-time
 * via getAllPosts() i SSG. Bedre å fange typos før deploy enn i runtime.
 *
 * MERK: gray-matter auto-konverterer YAML-datoer (2026-05-21) til JS Date.
 * Vi aksepterer både string og Date, og normaliserer til ISO date-string
 * (YYYY-MM-DD) som ble brukt til sortering.
 */
import { z } from "zod";

// YAML-datoer kommer som Date fra gray-matter. Vanlige strenger får regex-sjekk.
const isoDateString = z
  .union([z.string(), z.date()])
  .transform((v, ctx) => {
    if (v instanceof Date) {
      // Date → "YYYY-MM-DD" (UTC for stabil sortering).
      return v.toISOString().slice(0, 10);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date must be YYYY-MM-DD (got "${v}")`,
      });
      return z.NEVER;
    }
    return v;
  });

export const postFrontmatterSchema = z.object({
  title: z.string().min(1, "title is required"),
  tag: z.string().min(1, "tag is required"),
  excerpt: z.string().min(1, "excerpt is required"),
  published: isoDateString,
  draft: z.boolean().optional().default(false),
  readTimeMin: z.number().int().positive().optional(),
  coverImage: z.string().optional(),
  stua_thread: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface Post extends PostFrontmatter {
  slug: string;
  /** Alltid satt etter prosessering (utledet hvis ikke i frontmatter). */
  readTimeMin: number;
}
