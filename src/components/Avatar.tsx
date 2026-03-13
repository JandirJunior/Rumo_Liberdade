import { IMAGES } from "@/src/assets/images";

type AvatarProps = {
  character: keyof typeof IMAGES;
  size?: number;
};

export function Avatar({ character, size = 64 }: AvatarProps) {
  return (
    <img
      src={IMAGES[character]}
      width={size}
      height={size}
      loading="lazy"
      alt={character}
    />
  );
}
