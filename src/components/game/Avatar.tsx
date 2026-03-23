import { USER_DEFAULT_AVATAR } from "@/assets/images";
import Image from "next/image";

type AvatarProps = {
  character?: string;
  size?: number;
};

export function Avatar({ character, size = 64 }: AvatarProps) {
  const src = character || USER_DEFAULT_AVATAR;
  return (
    <div 
      className="relative rounded-full overflow-hidden bg-[var(--color-bg-dark)] flex-shrink-0 border-2 border-[var(--color-border)] medieval-border"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        fill
        className="object-cover"
        alt="Avatar"
        referrerPolicy="no-referrer"
        unoptimized
      />
    </div>
  );
}
