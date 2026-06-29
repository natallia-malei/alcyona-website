interface YandexMusicIconProps {
  className?: string;
}

export function YandexMusicIcon({ className = "w-6 h-6" }: YandexMusicIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.5 17.5h-2v-7.65l-3.4 7.65H7.5l4-9h-3v-1.5h6V17.5z" />
    </svg>
  );
}
