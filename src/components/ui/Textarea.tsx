import { typography } from "../../styles/typography";

interface TextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required,
  className = "",
}: TextareaProps) {
  return (
    <label className={`block ${className}`}>
      {label && <span className={`block mb-2 ${typography.caption}`}>{label}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full px-3 py-2 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors font-sans resize-y"
      />
    </label>
  );
}
