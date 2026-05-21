/*
 * MDX-komponentmap for manifest. Overstyrer Pullquote til variant="loud"
 * så Geir kan skrive vanlig <Pullquote>...</Pullquote> i manifest.mdx
 * uten å sette variant per sitat — alle 4 sitater i manifestet skal rope.
 *
 * Stamp og HalftoneBlock er rene re-eksporter (samme oppførsel som blog).
 */
import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { HalftoneBlock, Pullquote, Stamp } from "@/components/shared";

function LoudPullquote({ children }: { children: ReactNode }) {
  return <Pullquote variant="loud">{children}</Pullquote>;
}

export const manifestMdxComponents: MDXComponents = {
  Stamp,
  HalftoneBlock,
  Pullquote: LoudPullquote,
};
