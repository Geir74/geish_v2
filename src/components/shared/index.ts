/*
 * Barrel — re-eksporterer de 9 shared-komponentene og deres typer.
 * Bruk: `import { Stamp, StatusBadge } from "@/components/shared"`.
 */
export { VisitorCounter } from "./VisitorCounter";
export { UnderConstructionBanner } from "./UnderConstructionBanner";
export { WebringWidget } from "./WebringWidget";
export { GuestbookSnippet } from "./GuestbookSnippet";
export { StatusBadge } from "./StatusBadge";
export { Stamp } from "./Stamp";
export { ImagePlaceholder } from "./ImagePlaceholder";
export { HalftoneBlock } from "./HalftoneBlock";
export { Pullquote } from "./Pullquote";

export type {
  VisitorCounterProps,
  VisitorCounterSize,
} from "./VisitorCounter";
export type { UnderConstructionBannerProps } from "./UnderConstructionBanner";
export type {
  WebringWidgetProps,
  WebringVariant,
} from "./WebringWidget";
export type {
  GuestbookSnippetProps,
  GuestbookItem,
} from "./GuestbookSnippet";
export type { StatusBadgeProps, Status } from "./StatusBadge";
export type { StampProps } from "./Stamp";
export type { ImagePlaceholderProps } from "./ImagePlaceholder";
export type { HalftoneBlockProps } from "./HalftoneBlock";
export type { PullquoteProps, PullquoteVariant } from "./Pullquote";
