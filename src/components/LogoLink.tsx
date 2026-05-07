import Image from 'next/image';
import Link from 'next/link';

export function LogoLink() {
  return (
    <Link href="/" className="inline-flex items-center">
      <Image
        src="/unikodasphoto.png"
        alt="Unikodas"
        width={1885}
        height={834}
        priority
        className="h-8 w-auto sm:h-10"
      />
    </Link>
  );
}
