export const IMAGES = {
  FESTIN: "https://ibb.co/0yfXdrzL",
  ARCANO: "https://ibb.co/PswJS3kz",
  CACHE:  "https://ibb.co/4wKf2cLx",
  EXODIA: "https://ibb.co/wXRKFxn",
  REAVER: "https://ibb.co/GvsFj515",
  ORBIT:  "https://ibb.co/YFyFnQgG",
};

export type ImageKey = keyof typeof IMAGES;

export const MENTORS = IMAGES;

export const VILLAINS = Array.from({ length: 192 }, (_, i) => ({
  id: i + 1,
  image: `https://picsum.photos/seed/villain_${String(i + 1).padStart(3, "0")}/400/400`
}));

export const USER_DEFAULT_AVATAR = "https://ibb.co/PswJS3kz";
