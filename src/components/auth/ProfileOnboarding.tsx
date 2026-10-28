import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isProfileReady, useProfile } from "../../auth/hooks";
import { ProfileModal } from "./ProfileModal";

// Opens after sign-in while name/surname/phone or the data-processing consent
// are missing. "Later" hides it until the next page load.
export function ProfileOnboarding() {
  const { t } = useTranslation();
  const profile = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (!profile || isProfileReady(profile)) return null;

  return (
    <ProfileModal
      open={!dismissed}
      onClose={() => setDismissed(true)}
      title={t("profile.title")}
      cancelLabel={t("profile.later")}
    />
  );
}
