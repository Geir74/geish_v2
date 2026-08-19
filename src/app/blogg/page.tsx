/*
 * /blogg — bloggens liste-rute. Avis-estetikk per 02-PAGES.md Side 4:
 * brødsmule, masthead med double-line border, hero-post, arkiv-grid, sidebar.
 *
 * Static (force-static). Leser MDX-filer ved build-time.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HalftoneBlock, UnderConstructionBanner } from "@/components/shared";
import { t } from "@/content/i18n";
import { getAllPosts } from "@/content/posts";
import { aggregateMonths, aggregateTags } from "@/lib/blog/aggregate";
import { coverCardSrc, focalToPosition } from "@/lib/blog/cover";
import styles from "./page.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Bloggen — geish.no",
  description: "Lange poster. Tech, manifest, jakt, brød. Algoritmer ikke invitert.",
};

function formatNorwegianDate(iso: string): string {
  // "2026-05-18" → "18. mai 2026"
  const months = ["jan", "feb", "mars", "apr", "mai", "juni", "juli", "aug", "sep", "okt", "nov", "des"];
  const [year, month, day] = iso.split("-");
  return `${Number(day)}. ${months[Number(month) - 1]} ${year}`;
}

export default async function BloggListePage() {
  const C = t();
  const posts = await getAllPosts();
  const tags = aggregateTags(posts);
  const months = aggregateMonths(posts);

  const hero = posts[0];
  const archive = posts.slice(1);

  // UTGAVE-nummer: antall publiserte poster (lav, men gir avis-følelse).
  const issueNumber = posts.length;
  const lastUpdated = hero ? formatNorwegianDate(hero.published) : "—";

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>BLOGGEN</span>
        <span className={styles.right}>
          {posts.length} POSTER · OPPDATERT {lastUpdated}
        </span>
      </div>

      <div className={styles.masthead}>
        <div>
          <h1 className={styles.h1}>
            Bloggen.
            <br />
            <span className={styles.acc}>Lange tanker.</span>
          </h1>
          <p className={styles.deck}>
            Tech, manifest, jakt, brød, hund, prosjekter. Ingenting kortere enn 800 ord. Algoritmer ikke invitert.
          </p>
        </div>
        <div className={styles.issue}>
          <b>UTGAVE №&nbsp;{issueNumber}</b>
          {lastUpdated}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.feed}>
          {posts.length === 0 ? (
            <div className={styles.empty}>
              <UnderConstructionBanner />
            </div>
          ) : (
            <>
              {hero ? (
                <article className={styles.heroPost}>
                  <div className={styles.heroCover}>
                    {hero.coverImage ? (
                      /*
                       * 16:9-utsnittet (cover-hero.webp). priority: heroen er
                       * LCP-kandidat på /blogg. Eksplisitt width/height +
                       * fast containerhøyde → ingen CLS. object-position fra
                       * focal så crop-fokuset bevares i containeren.
                       */
                      <Image
                        src={hero.coverImage.src}
                        alt={hero.coverImage.alt}
                        width={720}
                        height={405}
                        priority
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className={styles.heroImg}
                        style={{
                          objectPosition: focalToPosition[hero.coverImage.focal],
                        }}
                      />
                    ) : (
                      /* Fallback: HalftoneBlock-dekor, uendret fra før. */
                      <div className={styles.heroHalftone} aria-hidden>
                        <HalftoneBlock w={360} h={260} density={0.45} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={styles.meta}>
                      <span>
                        {formatNorwegianDate(hero.published)} · {hero.readTimeMin} min
                      </span>{" "}
                      <span className={styles.tag}>#{hero.tag}</span>
                    </div>
                    <h2 className={styles.heroTitle}>
                      <Link href={`/blogg/${hero.slug}`}>{hero.title}</Link>
                    </h2>
                    <p className={styles.heroExcerpt}>{hero.excerpt}</p>
                    <div className={styles.read}>
                      →{" "}
                      <Link href={`/blogg/${hero.slug}`}>
                        Les hele ({hero.readTimeMin} min)
                      </Link>
                    </div>
                  </div>
                </article>
              ) : null}

              {archive.length > 0 ? (
                <div className={styles.archive}>
                  {archive.map((post) => (
                    <article key={post.slug} className={styles.post}>
                      {post.coverImage ? (
                        /*
                         * 1:1-utsnittet (cover-card.webp), lazy — kortene er
                         * under folden. aspect-ratio-boks i CSS hindrer CLS.
                         * Poster uten cover rendres nøyaktig som før (tekst).
                         */
                        <div className={styles.cardCover}>
                          <Image
                            src={coverCardSrc(post.coverImage)}
                            alt={post.coverImage.alt}
                            width={600}
                            height={600}
                            loading="lazy"
                            sizes="(max-width: 480px) 100vw, 50vw"
                            className={styles.cardImg}
                            style={{
                              objectPosition:
                                focalToPosition[post.coverImage.focal],
                            }}
                          />
                        </div>
                      ) : null}
                      <div className={styles.meta}>
                        <span>
                          {formatNorwegianDate(post.published)} · {post.readTimeMin} min
                        </span>
                        <span className={styles.tag}>#{post.tag}</span>
                      </div>
                      <h3 className={styles.postTitle}>
                        <Link href={`/blogg/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className={styles.postExcerpt}>{post.excerpt}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className={styles.side}>
          <div className={styles.about}>
            <strong>Om Geir</strong>
            {C.about.lead}
            <br />
            <br />
            <Link href="/">→ Tilbake til forsiden</Link>
          </div>

          {tags.length > 0 ? (
            <>
              <h4 className={styles.sideHead}>Tags</h4>
              <div className={styles.tagcloud}>
                {tags.map((t) => (
                  <a key={t.tag} href="#" className={styles.tagItem}>
                    #{t.tag}
                    <b>{t.count}</b>
                  </a>
                ))}
              </div>
            </>
          ) : null}

          {months.length > 0 ? (
            <>
              <h4 className={styles.sideHead}>Arkiv</h4>
              <div className={styles.archiveList}>
                {months.map((m) => (
                  <a key={m.key} href="#" className={styles.archiveRow}>
                    <span>{m.label}</span>
                    <span className={styles.archiveCount}>{m.count}</span>
                  </a>
                ))}
              </div>
            </>
          ) : null}

          <div className={styles.rss}>
            <b>RSS · ATOM · JSON</b>
            <a href="#">geish.no/feed</a>
          </div>
        </aside>
      </div>
    </main>
  );
}
