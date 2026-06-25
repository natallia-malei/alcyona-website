import { Hero } from "../sections/Hero";
import { TelegramCTA } from "../sections/TelegramCTA";
import { Photos } from "../sections/Photos";
import { Videos } from "../sections/Videos";
import { Releases } from "../sections/Releases";
import { Booking } from "../sections/Booking";

export function Landing() {
  return (
    <>
      <Hero />
      <TelegramCTA />
      <Photos />
      <Videos />
      <Releases />
      <Booking />
    </>
  );
}
