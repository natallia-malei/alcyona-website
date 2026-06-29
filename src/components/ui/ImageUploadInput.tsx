import { useRef, useState, type ChangeEvent } from "react";
import { uploadCover } from "../../supabase/storage";
import { Input } from "./Input";
import { typography } from "../../styles/typography";

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  uploadFn?: (file: File) => Promise<string>;
}

export function ImageUploadInput({
  label,
  value,
  onChange,
  uploadFn = uploadCover,
}: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadFn(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {label && <div className={`mb-2 ${typography.caption}`}>{label}</div>}

      <div className="flex items-start gap-4 mb-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-24 h-24 object-cover rounded-sm border border-white/10"
          />
        ) : (
          <div className="w-24 h-24 bg-bg border border-white/10 rounded-sm flex items-center justify-center text-fg-muted text-xs">
            No image
          </div>
        )}

        <div className="flex-1 space-y-2">
          <label className="inline-flex items-center px-3 py-2 bg-bg border border-white/20 rounded-sm text-sm text-white cursor-pointer hover:border-accent transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? "Uploading..." : "Upload new image"}
          </label>
          <p className={typography.caption}>JPG, PNG, GIF, WebP, SVG — up to 50 MB</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <Input
        label="…or paste image URL directly"
        type="url"
        value={value}
        onChange={onChange}
        placeholder="https://..."
      />
    </div>
  );
}
