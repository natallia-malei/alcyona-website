export const grids = {
  photos: "grid grid-cols-2 md:grid-cols-4 gap-4",
  videos: "grid md:grid-cols-2 gap-6",
  releases: "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
  releaseDetail: "grid md:grid-cols-[1fr_2fr] gap-12",
} as const;

export const flex = {
  center: "flex justify-center",
  wrapInline: "flex flex-wrap items-center gap-4",
} as const;
