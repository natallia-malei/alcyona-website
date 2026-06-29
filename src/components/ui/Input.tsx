import { typography } from "../../styles/typography";

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "date" | "number";
  required?: boolean;
  className?: string;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  className = "",
}: InputProps) {
  return (
    <label className={`block ${className}`}>
      {label && <span className={`block mb-2 ${typography.caption}`}>{label}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors"
      />
    </label>
  );
}
