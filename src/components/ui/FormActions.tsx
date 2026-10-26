import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface FormActionsProps {
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitting?: boolean;
}

export function FormActions({
  onCancel,
  cancelLabel,
  submitLabel,
  submitting = false,
}: FormActionsProps) {
  const { t } = useTranslation();
  const cancel = cancelLabel ?? t("common.cancel");
  const submit = submitLabel ?? t("common.save");

  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          {cancel}
        </Button>
      )}
      <Button size="sm" type="submit" disabled={submitting}>
        {submitting ? t("common.saving") : submit}
      </Button>
    </div>
  );
}
