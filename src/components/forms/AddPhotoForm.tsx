import { useState } from "react";
import { useTranslation } from "react-i18next";
import { uploadPhoto } from "../../supabase/storage";
import { ImageUploadInput } from "../ui/ImageUploadInput";
import { FormActions } from "../ui/FormActions";

interface AddPhotoFormProps {
  onSubmit: (url: string) => Promise<void>;
  onCancel: () => void;
}

export function AddPhotoForm({ onSubmit, onCancel }: AddPhotoFormProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setSubmitting(true);
    try {
      await onSubmit(url);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ImageUploadInput
        label={t("admin.photoLabel")}
        value={url}
        onChange={setUrl}
        uploadFn={uploadPhoto}
      />
      <FormActions onCancel={onCancel} submitLabel={t("common.add")} submitting={submitting} />
    </form>
  );
}
