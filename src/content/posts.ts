/*
 * Filbasert blog-content-API.
 *
 * Leser .mdx-filer fra src/content/posts/, parser frontmatter med
 * gray-matter, validerer med zod, utleder slug fra filnavn og readTimeMin
 * fra ordtelling (om ikke satt eksplisitt). Drafts skjules i prod.
 *
 * Ingen DB — git er publiseringsmekanismen.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import {
  postFrontmatterSchema,
  type CoverImage,
  type Post,
  type PostFrontmatter,
} from "@/lib/blog/schema";
import { deriveReadTime } from "@/lib/blog/reading-time";

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

interface ParsedFile {
  filename: string;
  post: Post;
  content: string;
}

/*
 * Flater ut zod-issues til lesbare linjer. Union-feil (invalid_union) får
 * grenene sine ekspandert slik at f.eks. «coverImage.alt er påkrevd…»
 * faktisk vises i byggefeilen — ikke bare et generisk «Invalid input».
 */
function formatIssues(
  issues: z.core.$ZodIssue[],
  prefix = "",
): string[] {
  return issues.flatMap((issue) => {
    const path = [prefix, ...issue.path].filter(Boolean).join(".");
    if (issue.code === "invalid_union") {
      return issue.errors.flatMap((branch) => formatIssues(branch, path));
    }
    return [`  - ${path || "(root)"}: ${issue.message}`];
  });
}

/*
 * Normaliserer coverImage fra frontmatter-unionen til intern CoverImage-form.
 *
 * - Ren string (gammel form): normaliseres til { src, alt: "", focal: "center" }
 *   med en byggetids-ADVARSEL om manglende alt — bakoverkompat, ikke feil.
 * - Objekt: allerede validert av zod (alt påkrevd, focal har default) —
 *   returneres som den er.
 */
function normalizeCover(
  raw: PostFrontmatter["coverImage"],
  filename: string,
): CoverImage | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    console.warn(
      `[blog] src/content/posts/${filename}: coverImage er en ren string uten alt-tekst — bruk objekt { src, alt } for tilgjengelighet.`,
    );
    return { src: raw, alt: "", focal: "center" };
  }
  return raw;
}

async function readPostFile(filename: string): Promise<ParsedFile> {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = postFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = formatIssues(result.error.issues).join("\n");
    throw new Error(
      `Invalid frontmatter in src/content/posts/${filename}:\n${issues}`,
    );
  }

  const slug = filename.replace(/\.mdx$/, "");
  const readTimeMin = result.data.readTimeMin ?? deriveReadTime(content);
  // Cover normaliseres HER slik at resten av appen aldri ser unionen.
  const coverImage = normalizeCover(result.data.coverImage, filename);

  return {
    filename,
    post: { ...result.data, slug, readTimeMin, coverImage },
    content,
  };
}

async function readAllPostFiles(): Promise<ParsedFile[]> {
  const files = await fs.readdir(POSTS_DIR);
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
  return Promise.all(mdxFiles.map(readPostFile));
}

/**
 * Alle non-draft poster sortert nyeste først.
 * I dev inkluderes drafts så Geir kan preview dem.
 */
export async function getAllPosts(): Promise<Post[]> {
  const parsed = await readAllPostFiles();
  const isProd = process.env.NODE_ENV === "production";
  return parsed
    .map((p) => p.post)
    .filter((p) => !p.draft || !isProd)
    .sort((a, b) => b.published.localeCompare(a.published));
}

/**
 * Hent én post + rå MDX-content for kompilering.
 * Returnerer null hvis ikke funnet.
 */
export async function getPostBySlug(
  slug: string,
): Promise<{ post: Post; mdxSource: string } | null> {
  const filename = `${slug}.mdx`;
  const filePath = path.join(POSTS_DIR, filename);
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }
  const parsed = await readPostFile(filename);
  const isProd = process.env.NODE_ENV === "production";
  if (parsed.post.draft && isProd) return null;
  return { post: parsed.post, mdxSource: parsed.content };
}

/**
 * Slugs for generateStaticParams (App Router SSG).
 * Inkluderer ikke drafts — de skal ikke deploy-bygges.
 */
export async function getAllSlugs(): Promise<string[]> {
  const parsed = await readAllPostFiles();
  return parsed
    .map((p) => p.post)
    .filter((p) => !p.draft)
    .map((p) => p.slug);
}
