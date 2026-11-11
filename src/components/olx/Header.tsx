import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="olx-header sticky top-0 z-50 border-b border-olx-border bg-olx-card">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3">
        <Link to="/" className="shrink-0">
          <Logo size={28} />
        </Link>
      </div>
    </header>
  );
}
