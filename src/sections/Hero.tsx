import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFeaturedRelease, useStorageActions } from "../storage/hooks";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { PageTitle } from "../components/ui/PageTitle";
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
import { flex } from "../styles/layouts";

export function Hero() {
  const { t } = useTranslation();
  const tr = useLocalizedText();
  const release = useFeaturedRelease();
  const { upsertRelease } = useStorageActions();
  const [editing, setEditing] = useState(false);

  if (!release) return null;

  const handleSave = async (next: typeof release) => {
    await upsertRelease(next);
    setEditing(false);
  };

  return (
    <>
      <HeroBackdrop coverUrl={release.coverUrl}>
        <EditButton
          onClick={() => setEditing(true)}
          className="absolute top-20 right-4 md:right-12 z-20"
        />
        <Container className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <ReleaseCover coverUrl={release.coverUrl} alt={tr(release.title)} size="lg" />
          <div>
            <Eyebrow tracking="extra" className="text-accent mb-4">
              {release.type === "album" ? "New Album" : "New Release"}
            </Eyebrow>
            <PageTitle size="hero" className="mb-6">
              {tr(release.title)}
            </PageTitle>
            <Lead className="mb-8 max-w-xl">{tr(release.description)}</Lead>
            <div className={flex.wrapInline}>
              <Button to={`/release/${release.id}`}>{t("hero.listenNow")}</Button>
              {release.links.spotify && (
                <PlatformLink href={release.links.spotify}>Spotify →</PlatformLink>
              )}
              {release.links.appleMusic && (
                <PlatformLink href={release.links.appleMusic}>Apple Music →</PlatformLink>
              )}
            </div>
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
