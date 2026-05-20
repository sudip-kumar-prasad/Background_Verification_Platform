import Image from 'next/image';
import clsx from 'clsx';

type AvatarProps = {
  /** URL of the avatar image – place the file in `/public` or use any external URL */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Size in pixels (default: 48) */
  size?: number;
  /** Optional extra Tailwind classes (e.g., rounded-full, border) */
  className?: string;
};

export default function Avatar({
  src = '/default-avatar.png',
  alt = 'User avatar',
  size = 48,
  className,
}: AvatarProps) {
  return (
    <div
      className={clsx(
        'overflow-hidden bg-slate-800 flex items-center justify-center',
        'rounded-full',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} width={size} height={size} priority />
    </div>
  );
}
