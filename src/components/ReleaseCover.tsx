type Size = "md" | "lg";

interface ReleaseCoverProps {
  coverUrl: string;
  alt: string;
  size?: Size;
}

const sizeClass: Record<Size, string> = {
  md: "w-full shadow-2xl",
  lg: "w-full max-w-md mx-auto shadow-2xl rounded-sm",
};

export function ReleaseCover({ coverUrl, alt, size = "md" }: ReleaseCoverProps) {
  return <img src={coverUrl} alt={alt} className={sizeClass[size]} />;
}
