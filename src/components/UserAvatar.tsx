import { USER_DEFAULT_AVATAR } from "@/src/assets/images";
import Image from "next/image";

type UserAvatarProps = {
  src?: string | null;
  size?: number;
  alt?: string;
};

export function UserAvatar({ src, size = 64, alt = "User Avatar" }: UserAvatarProps) {
  return (
    <div 
      className="relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={src || USER_DEFAULT_AVATAR}
        alt={alt}
        fill
        className="object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
