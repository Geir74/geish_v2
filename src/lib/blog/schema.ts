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

/*
 * coverImage: union string | objekt (bakoverkompat, se openspec e2-cover-images).
 *
 * - Ren string er gammel form — normaliseres senere (posts.ts) til objekt med
 *   tom alt og en byggetids-advarsel. Ikke en feil, for å ikke brekke gamle poster.
 * - Objekt-formen KREVER alt (tilgjengelighet/SEO by default). Manglende alt
 *   kaster ved build-time med fil-navngitt melding (kastes i posts.ts).
 * - focal er et nøkkelord som styrer crop-fokus / object-position i rendringen.
 */
export const focalValues = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
] as const;

const focalSchema = z.enum(focalValues).default("center");

const coverObjectSchema = z.object({
  src: z.string().min(1, "coverImage.src is required"),
  // error-parameteren dekker også helt manglende nøkkel (invalid_type),
  // ikke bare tom streng — byggefeilen skal alltid si HVA som mangler.
  alt: z
    .string({ error: "coverImage.alt er påkrevd når coverImage er et objekt" })
    .min(1, "coverImage.alt er påkrevd når coverImage er et objekt"),
  focal: focalSchema,
  credit: z.string().optional(),
});

export const coverImageSchema = z
  .union([z.string().min(1), coverObjectSchema])
  .optional();

/**
 * Normalisert intern cover-form. Rendringslaget forholder seg alltid til
 * denne — aldri til string/objekt-unionen fra frontmatter.
 */
export type CoverImage = {
  src: string;
  alt: string;
  focal: (typeof focalValues)[number];
  credit?: string;
};

export const postFrontmatterSchema = z.object({
  title: z.string().min(1, "title is required"),
  tag: z.string().min(1, "tag is required"),
  excerpt: z.string().min(1, "excerpt is required"),
  published: isoDateString,
  draft: z.boolean().optional().default(false),
  readTimeMin: z.number().int().positive().optional(),
  coverImage: coverImageSchema,
  stua_thread: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface Post extends Omit<PostFrontmatter, "coverImage"> {
  slug: string;
  /** Alltid satt etter prosessering (utledet hvis ikke i frontmatter). */
  readTimeMin: number;
  /** Normalisert cover (aldri unionen) — se normalizeCover i posts.ts. */
  coverImage?: CoverImage;
}
