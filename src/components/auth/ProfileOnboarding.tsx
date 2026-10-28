import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProfileInput } from "../../types";
import { isProfileComplete, useAuthActions, useProfile } from "../../auth/hooks";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../ui/Modal";
import { ProfileForm } from "../forms/ProfileForm";

// Opens after sign-in while name/surname/phone are missing.
// "Later" hides it until the next page load.
export function ProfileOnboarding() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { updateProfile } = useAuthActions();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);

  if (!profile || isProfileComplete(profile)) return null;

  const handleSave = async (input: ProfileInput) => {
    await updateProfile(input);
    toast.success(t("profile.saved"));
  };

  return (
    <Modal open={!dismissed} onClose={() => setDismissed(true)} title={t("profile.title")}>
      <ProfileForm
        initial={profile}
        onSubmit={handleSave}
        onCancel={() => setDismissed(true)}
        cancelLabel={t("profile.later")}
      />
    </Modal>
  );
}
