import type { StreamingLinks } from "../types";
import { PlatformLink } from "./PlatformLink";

type Layout = "row" | "col";

interface ReleaseLinksProps {
  links: StreamingLinks;
  layout?: Layout;
  className?: string;
}

const layoutClass: Record<Layout, string> = {
  row: "flex flex-wrap items-center gap-4",
  col: "flex flex-col gap-2",
};

export function ReleaseLinks({ links, layout = "col", className = "" }: ReleaseLinksProps) {
  return (
    <div className={`${layoutClass[layout]} ${className}`}>
      {links.spotify && <PlatformLink href={links.spotify}>Spotify →</PlatformLink>}
      {links.appleMusic && <PlatformLink href={links.appleMusic}>Apple Music →</PlatformLink>}
      {links.youtube && <PlatformLink href={links.youtube}>YouTube →</PlatformLink>}
    </div>
  );
}
