import Link from "next/link";
import { Search, Heart, User } from "lucide-react";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="MEMODISE Logo"
            className="h-11 w-11 object-contain"
          />

          <div>
            <h1 className="text-xl font-light tracking-[0.35em] text-white uppercase">
              MEMODISE
            </h1>
            <p className="mt-1 text-[10px] tracking-[0.22em] text-white/45 uppercase">
              Digital Memorial Platform
            </p>
          </div>
        </Link>

        {/* CENTER: NAV */}
        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="/"
            className="text-xs font-light tracking-[0.18em] text-white/70 uppercase transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/memorial"
            className="text-xs font-light tracking-[0.18em] text-white/70 uppercase transition hover:text-white"
          >
            Memorials
          </Link>

          <Link
            href="/obituary"
            className="text-xs font-light tracking-[0.18em] text-white/70 uppercase transition hover:text-white"
          >
            Obituaries
          </Link>

          <Link
            href="/tribute"
            className="text-xs font-light tracking-[0.18em] text-white/70 uppercase transition hover:text-white"
          >
            Tributes
          </Link>
        </nav>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white md:flex"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link
            href="/create-memorial"
            className="hidden items-center gap-2 rounded-full border border-[#C7A76A]/40 px-5 py-2.5 text-xs font-light tracking-[0.16em] text-[#C7A76A] uppercase transition hover:bg-[#C7A76A] hover:text-black md:flex"
          >
            <Heart className="h-4 w-4" />
            Create Memorial
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-medium tracking-[0.14em] text-black uppercase transition hover:bg-[#C7A76A]"
          >
            <User className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}