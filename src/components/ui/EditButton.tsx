import { EditIcon } from "../icons/EditIcon";

interface EditButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function EditButton({ onClick, label = "Edit", className = "" }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-2 px-3 py-2 bg-bg-elevated/80 backdrop-blur-sm border border-white/20 rounded-sm text-sm text-white hover:bg-bg-elevated hover:border-accent transition-colors ${className}`}
    >
      <EditIcon />
      <span>{label}</span>
    </button>
  );
}
