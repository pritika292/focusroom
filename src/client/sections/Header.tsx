import { useTheme } from "../lib/theme.js";

export function Header() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <header className="border-b border-border">
      <div className="max-w-page mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="https://pritika.studio"
          className="font-mono text-[12px] tracking-[0.18em] uppercase text-muted hover:text-accent transition-colors"
        >
          FOCUSROOM
        </a>
        <nav className="flex items-center gap-5">
          <a
            href="https://pritika.studio"
            className="font-mono text-[12px] tracking-[0.18em] uppercase text-muted hover:text-accent transition-colors"
          >
            pritika.studio
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${next} theme`}
            className="text-muted hover:text-accent transition-colors text-lg leading-none"
          >
            {theme === "dark" ? "◐" : "◑"}
          </button>
        </nav>
      </div>
    </header>
  );
}
