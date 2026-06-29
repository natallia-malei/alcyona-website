import type { LocalizedText } from "../../types";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { typography } from "../../styles/typography";

interface LocalizedTextInputProps {
  label?: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

export function LocalizedTextInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  required,
}: LocalizedTextInputProps) {
  const Field = multiline ? Textarea : Input;

  return (
    <div>
      {label && <div className={`mb-2 ${typography.caption}`}>{label}</div>}
      <div className="grid md:grid-cols-2 gap-3">
        <Field
          label="RU"
          value={value.ru}
          onChange={(ru) => onChange({ ...value, ru })}
          rows={rows}
          required={required}
        />
        <Field
          label="EN"
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
          rows={rows}
          required={required}
        />
      </div>
    </div>
  );
}
