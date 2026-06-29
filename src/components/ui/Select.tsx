import { typography } from "../../styles/typography";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  required?: boolean;
  className?: string;
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  className = "",
}: SelectProps<T>) {
  return (
    <label className={`block ${className}`}>
      {label && <span className={`block mb-2 ${typography.caption}`}>{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        required={required}
        className="w-full px-3 py-2 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
