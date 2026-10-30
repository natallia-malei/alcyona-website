import { Hero } from "../sections/Hero";
import { TelegramCTA } from "../sections/TelegramCTA";
import { Photos } from "../sections/Photos";
import { Videos } from "../sections/Videos";
import { Releases } from "../sections/Releases";
import { Booking } from "../sections/Booking";
import { Concerts } from "../sections/Concerts";
import { Marquee } from "../components/fx/Marquee";
import { useReleases } from "../storage/hooks";
import { useLocalizedText } from "../hooks/useLocalizedText";

export function Landing() {
  const tr = useLocalizedText();
  const releases = useReleases();
  const marqueeItems = ["ALCYONA", ...releases.map((r) => tr(r.title))];

  return (
    <>
      <Hero />
      <Marquee items={marqueeItems} />
      <Releases />
      <Concerts />
      <Videos />
      <Photos />
      <TelegramCTA />
      <Booking />
    </>
  );
}
