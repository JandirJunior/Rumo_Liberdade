export const IMAGES = {
  FESTIN: "https://picsum.photos/seed/festin/400/400",
  ARCANO: "https://picsum.photos/seed/arcano/400/400",
  CACHE: "https://picsum.photos/seed/cache/400/400",
  EXODIA: "https://picsum.photos/seed/exodia/400/400",
  REAVER: "https://picsum.photos/seed/reaver/400/400",
  ORBIT: "https://picsum.photos/seed/orbit/400/400",
};

export type ImageKey = keyof typeof IMAGES;

export const MENTORS = IMAGES;

export const VILLAINS = Array.from({ length: 192 }, (_, i) => ({
  id: i + 1,
  image: `https://picsum.photos/seed/villain_${String(i + 1).padStart(3, "0")}/400/400`
}));

export const USER_DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";
