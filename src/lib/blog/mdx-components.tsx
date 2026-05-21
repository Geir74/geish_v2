/*
 * MDX-komponentmap for blog-posts.
 *
 * Eksponerer et lite, kuratert sett til MDXRemote sin `components`-prop.
 * Andre shared-komponenter (GuestbookSnippet, WebringWidget, osv.) eksponeres
 * IKKE — de hører ikke hjemme i brødtekst.
 */
import type { MDXComponents } from "mdx/types";
import { HalftoneBlock, Pullquote, Stamp } from "@/components/shared";

export const mdxComponents: MDXComponents = {
  Stamp,
  HalftoneBlock,
  Pullquote,
  // HTML-elementer styles via .prose-klassen på wrapper-elementet, ikke per-tag
  // her — det holder MDX-komponentmappen tom og lar CSS Module være kilden.
};
