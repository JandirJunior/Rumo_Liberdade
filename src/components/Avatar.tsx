import { IMAGES } from "@/src/assets/images";
import Image from "next/image";

type AvatarProps = {
  character: keyof typeof IMAGES;
  size?: number;
};

export function Avatar({ character, size = 64 }: AvatarProps) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <Image
        src={IMAGES[character]}
        fill
        className="object-cover rounded-full"
        alt={character}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
