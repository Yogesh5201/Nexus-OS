import { OS } from "@/components/shell/OS";

/**
 * The OS owns the entire viewport. Everything (boot sequence, 3D wallpaper,
 * window manager, dock) is mounted client-side inside <OS />.
 */
export default function Page() {
  return <OS />;
}
