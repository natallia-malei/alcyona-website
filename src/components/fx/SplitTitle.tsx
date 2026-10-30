import { Fragment, type ElementType } from "react";

interface SplitTitleProps {
  text: string;
  as?: ElementType;
  /** Задержка перед первой буквой, мс */
  delay?: number;
  /** Шаг между буквами, мс */
  stagger?: number;
  className?: string;
}

/**
 * Заголовок, который собирается из света: буквы всплывают из размытия по очереди.
 * Экранные чтецы получают слово целиком через aria-label.
 */
export function SplitTitle({
  text,
  as: Tag = "h1",
  delay = 200,
  stagger = 55,
  className = "",
}: SplitTitleProps) {
  const words = text.split(" ");
  // Порядковый номер первой буквы каждого слова — для сквозной задержки
  const offsets = words.map((_, w) => words.slice(0, w).join("").length);

  return (
    <Tag aria-label={text} className={className}>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span aria-hidden="true" className="inline-block whitespace-nowrap">
            {[...word].map((char, c) => (
              <span
                key={c}
                className="split-char"
                style={{ animationDelay: `${delay + (offsets[w] + c) * stagger}ms` }}
              >
                {char}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}
