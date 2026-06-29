import { Button } from "./Button";

interface FormActionsProps {
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitting?: boolean;
}

export function FormActions({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel = "Save",
  submitting = false,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button size="sm" type="submit">
        {submitting ? "..." : submitLabel}
      </Button>
    </div>
  );
}
