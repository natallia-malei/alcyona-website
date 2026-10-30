import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFeaturedRelease, useStorageActions } from "../storage/hooks";
import { useIsAdmin } from "../auth/hooks";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { SplitTitle } from "../components/fx/SplitTitle";
import { Countdown } from "../components/ui/Countdown";
import { typography } from "../styles/typography";
import { Button } from "../components/ui/Button";
import { Container } from "../components/layout/Container";
import { Eyebrow } from "../components/ui/Eyebrow";
import { PlatformLink } from "../components/ui/PlatformLink";
import { HeroBackdrop } from "../components/layout/HeroBackdrop";
import { ReleaseCover } from "../components/release/ReleaseCover";
import { Lead } from "../components/ui/Lead";
import { EditButton } from "../components/ui/EditButton";
import { Modal } from "../components/ui/Modal";
import { ReleaseForm } from "../components/forms/ReleaseForm";
import { SpotifyIcon } from "../components/icons/SpotifyIcon";
import { AppleMusicIcon } from "../components/icons/AppleMusicIcon";
import { YouTubeIcon } from "../components/icons/YouTubeIcon";
import { YandexMusicIcon } from "../components/icons/YandexMusicIcon";
import { VKIcon } from "../components/icons/VKIcon";

export function Hero() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const release = useFeaturedRelease();
  const { upsertRelease } = useStorageActions();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);

  if (!release) return null;

  const handleSave = async (next: typeof release) => {
    await upsertRelease(next);
    setEditing(false);
  };

  return (
    <>
      <HeroBackdrop>
        {isAdmin && (
          <EditButton
            onClick={() => setEditing(true)}
            className="absolute top-20 right-4 md:right-12 z-20"
          />
        )}
        <Container className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="mx-auto w-full max-w-[min(28rem,44svh)] px-3 animate-[rise_1.2s_cubic-bezier(.2,.7,.2,1)_both] md:max-w-md">
            <ReleaseCover coverUrl={release.coverUrl} alt={tr(release.title)} size="lg" tilt />
          </div>
          <div>
            <Eyebrow tracking="extra" className="text-accent mb-5">
              {release.type === "album" ? t("hero.newAlbum") : t("hero.newRelease")}
            </Eyebrow>
            <SplitTitle
              key={release.id}
              text={tr(release.title)}
              delay={350}
              className={`${typography.heading} text-5xl sm:text-6xl lg:text-8xl leading-[0.95] mb-6`}
            />
            <Lead className="mb-8 max-w-xl animate-[rise_1s_cubic-bezier(.2,.7,.2,1)_.8s_both]">
              {tr(release.description)}
            </Lead>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4 animate-[rise_1s_cubic-bezier(.2,.7,.2,1)_1s_both]">
              <Button to={`/release/${release.id}`} glow>
                {t("hero.listenNow")}
              </Button>
              <div className="flex flex-wrap gap-2">
                {release.links.spotify && (
                  <PlatformLink href={release.links.spotify} variant="icon" ariaLabel="Spotify">
                    <SpotifyIcon />
                  </PlatformLink>
                )}
                {release.links.appleMusic && (
                  <PlatformLink
                    href={release.links.appleMusic}
                    variant="icon"
                    ariaLabel="Apple Music"
                  >
                    <AppleMusicIcon />
                  </PlatformLink>
                )}
                {release.links.youtube && (
                  <PlatformLink href={release.links.youtube} variant="icon" ariaLabel="YouTube">
                    <YouTubeIcon />
                  </PlatformLink>
                )}
                {release.links.yandexMusic && (
                  <PlatformLink
                    href={release.links.yandexMusic}
                    variant="icon"
                    ariaLabel="Yandex Music"
                  >
                    <YandexMusicIcon />
                  </PlatformLink>
                )}
                {release.links.vk && (
                  <PlatformLink href={release.links.vk} variant="icon" ariaLabel="VK">
                    <VKIcon />
                  </PlatformLink>
                )}
              </div>
            </div>
            <Countdown to={release.releaseDate} label={t("hero.untilRelease")} className="mt-8" />
          </div>
        </Container>
      </HeroBackdrop>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit featured release">
        <ReleaseForm
          initialRelease={release}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
