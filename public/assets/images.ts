export const IMAGES = {
  FESTIN: "/assets/mentors/mentor_festin.webp",
  ARCANO: "/assets/mentors/mentor_arcano.webp",
  CACHE: "/assets/mentors/mentor_cache.webp",
  EXODIA: "/assets/mentors/mentor_exodia.webp",
  REAVER: "/assets/mentors/mentor_reaver.webp",
  ORBIT: "/assets/mentors/mentor_orbit.webp",
};

export type ImageKey = keyof typeof IMAGES;

export const MENTORS = IMAGES;

export const VILLAINS = Array.from({ length: 192 }, (_, i) => ({
  id: i + 1,
  image: `/assets/villains/villain_${String(i + 1).padStart(3, "0")}.webp`
}));

export const USER_DEFAULT_AVATAR = "/assets/user/avatar_default.webp";
