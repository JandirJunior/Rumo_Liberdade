// ===== CHARACTER CLASSES =====
export const IMAGES = {
  FESTIN: "https://ibb.co/0yfXdrzL",
  ARCANO: "https://ibb.co/PswJS3kz",
  CACHE: "https://ibb.co/4wKf2cLx",
  EXODIA: "https://ibb.co/wXRKFxn",
  REAVER: "https://ibb.co/GvsFj515",
  ORBIT: "https://ibb.co/YFyFnQgG",
};

export type ImageKey = keyof typeof IMAGES;

// ===== PAGE BACKGROUNDS =====
export const PAGE_BACKGROUNDS = {
  LOGIN: "https://ibb.co/23jJ57gK",
  DASHBOARD: "https://ibb.co/rGjY8cyK",
  ATTRIBUTES: "https://ibb.co/0yYwRDgp",
  INVESTMENTS: "https://ibb.co/hJLhyhfp",
  QUESTS: "https://ibb.co/FqwPCv9S",
  VILLAINS: "https://ibb.co/N2B8VM7s",
  MENTORS: "https://ibb.co/wN4B243r",
  TAVERN: "https://ibb.co/HDvDxRhv",
};

// ===== VILLAIN IMAGES =====
export const VILLAIN_IMAGES = {
  VILLAIN000: "https://ibb.co/FbMGY5Zz",
  VILLAIN001: "https://ibb.co/zVbgMT0m",
  VILLAIN002: "https://ibb.co/cSXJbGrB",
  VILLAIN003: "https://ibb.co/s9Lxhh4g",
};

// ===== MENTORS (uses character classes) =====
export const MENTORS = IMAGES;

// ===== VILLAINS (legacy villain images) =====
export const VILLAINS = Array.from({ length: 192 }, (_, i) => {
  const villainIndex = i % 4;
  const villainKey = Object.keys(VILLAIN_IMAGES)[villainIndex] as keyof typeof VILLAIN_IMAGES;
  return {
    id: i + 1,
    image: VILLAIN_IMAGES[villainKey]
  };
});

// ===== DEFAULT AVATAR =====
export const USER_DEFAULT_AVATAR = IMAGES.ARCANO;
