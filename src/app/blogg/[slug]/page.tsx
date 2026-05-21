/*
 * /blogg/[slug] — enkeltpost. Static (force-static) via generateStaticParams.
 * Newsreader-typografi for brødtekst, drop-cap på første paragraf,
 * MDX-komponenter (Stamp, HalftoneBlock, Pullquote) tilgjengelig.
 * Bunn-blokk lenker til Stua-tråd hvis stua_thread satt.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { t } from "@/content/i18n";
import { getAllSlugs, getPostBySlug } from "@/content/posts";
import { mdxComponents } from "@/lib/blog/mdx-components";
import prose from "@/lib/blog/prose.module.css";
import styles from "./page.module.css";

export const dynamic = "force-static";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) return { title: "Ikke funnet — geish.no" };
  return {
    title: `${result.post.title} — Bloggen — geish.no`,
    description: result.post.excerpt,
  };
}

function formatNorwegianDate(iso: string): string {
  const months = ["jan", "feb", "mars", "apr", "mai", "juni", "juli", "aug", "sep", "okt", "nov", "des"];
  const [year, month, day] = iso.split("-");
  return `${Number(day)}. ${months[Number(month) - 1]} ${year}`;
}

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) notFound();

  const { post, mdxSource } = result;
  const C = t();
  const stuaHref = post.stua_thread ? `/stua/${post.stua_thread}` : "/stua";

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <Link href="/blogg" className={styles.crumbLink}>
          BLOGGEN
        </Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{post.slug.toUpperCase()}</span>
      </div>

      <article className={styles.article}>
        <header className={styles.header}>
          <div className={styles.meta}>
            <span>
              {formatNorwegianDate(post.published)} · {post.readTimeMin} min
            </span>
            <span className={styles.tag}>#{post.tag}</span>
          </div>
          <h1 className={styles.h1}>{post.title}</h1>
          <p className={styles.deck}>{post.excerpt}</p>
        </header>

        <div className={prose.prose}>
          <MDXRemote source={mdxSource} components={mdxComponents} />
        </div>

        <footer className={styles.stuaLink}>
          <Link href={stuaHref}>→ Diskuter i Stua</Link>
        </footer>
      </article>
    </main>
  );
}
