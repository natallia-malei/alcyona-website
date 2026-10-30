type Align = "start" | "center";

interface OrnamentProps {
  align?: Align;
  className?: string;
}

const alignClass: Record<Align, string> = {
  start: "justify-start",
  center: "justify-center",
};

/** Ромб между двумя золотыми линиями — разделитель под заголовками секций. */
export function Ornament({ align = "start", className = "" }: OrnamentProps) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${alignClass[align]} ${className}`}>
      <span className="h-px w-24 bg-linear-to-r from-transparent to-accent" />
      <span className="size-1.5 rotate-45 border border-accent" />
      <span className="h-px w-24 bg-linear-to-l from-transparent to-accent" />
    </div>
  );
}
