interface FiligreeProps {
  /** Отступ рамки от краёв, px */
  inset?: number;
}

const edge =
  "absolute bg-accent-hi transition-transform duration-500 ease-[cubic-bezier(.6,.1,.2,1)]";
const shown = "group-hover:scale-100 group-focus-visible:scale-100";

/**
 * Тонкая золотая рамка, которая обегает родителя с классом `group` при наведении или фокусе:
 * верх → правый край → низ → левый край, потом загораются ромбы в углах.
 */
export function Filigree({ inset = 0 }: FiligreeProps) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute z-10" style={{ inset }}>
      <span className={`${edge} ${shown} inset-x-0 top-0 h-px origin-left scale-x-0`} />
      <span
        className={`${edge} ${shown} inset-y-0 right-0 w-px origin-top scale-y-0 group-hover:delay-300`}
      />
      <span
        className={`${edge} ${shown} inset-x-0 bottom-0 h-px origin-right scale-x-0 group-hover:delay-600`}
      />
      <span
        className={`${edge} ${shown} inset-y-0 left-0 w-px origin-bottom scale-y-0 group-hover:delay-900`}
      />
      {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map(
        (pos) => (
          <span
            key={pos}
            className={`absolute ${pos} size-2 rotate-45 scale-0 border border-accent-hi bg-bg transition-transform duration-500 group-hover:scale-100 group-hover:delay-[1100ms] group-focus-visible:scale-100`}
          />
        ),
      )}
    </span>
  );
}
