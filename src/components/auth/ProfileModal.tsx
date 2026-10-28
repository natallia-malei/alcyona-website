import { useTranslation } from "react-i18next";
import type { ProfileInput } from "../../types";
import { useAuthActions, useProfile } from "../../auth/hooks";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../ui/Modal";
import { ProfileForm } from "../forms/ProfileForm";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  cancelLabel?: string;
}

// Profile form in a modal: onboarding, "Profile" in the account menu, "My bookings"
export function ProfileModal({ open, onClose, title, cancelLabel }: ProfileModalProps) {
  const { t } = useTranslation();
  const profile = useProfile();
  const { updateProfile } = useAuthActions();
  const toast = useToast();

  if (!profile) return null;

  const handleSave = async (input: ProfileInput) => {
    await updateProfile(input);
    toast.success(t("profile.saved"));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title ?? t("profile.editTitle")}>
      <ProfileForm
        initial={profile}
        onSubmit={handleSave}
        onCancel={onClose}
        cancelLabel={cancelLabel}
      />
    </Modal>
  );
}
