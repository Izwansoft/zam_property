import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/images/brand/icon-light.png"
      width={36}
      height={36}
      className="me-1.5 rounded-md transition-all dark:hidden group-data-[collapsible=icon]:size-8"
      alt="lamaniaga logo"
    />
  );
}

export function LogoDark() {
  return (
    <Image
      src="/images/brand/icon-dark.png"
      width={36}
      height={36}
      className="me-1.5 hidden rounded-md transition-all dark:block group-data-[collapsible=icon]:size-8"
      alt="lamaniaga logo"
    />
  );
}
