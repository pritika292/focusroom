export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="max-w-page mx-auto px-6 py-12 mt-12 border-t border-border">
      <div className="max-w-content space-y-3 text-[14px] text-muted leading-relaxed">
        <p>
          Twenty hardcoded personas, sixty turns per simulation, roughly two thirds participate.
          Each persona has a fixed demographic and voice; some run their mouth, some scroll past.
          Like a real audience.
        </p>
        <p>
          Built by{" "}
          <a
            href="https://pritika.studio"
            className="text-text hover:text-accent transition-colors"
          >
            Pritika Priyadarshini
          </a>
          . Part of the pritika.studio family of demos. Source on{" "}
          <a
            href="https://github.com/pritika292/focusroom"
            className="text-text hover:text-accent transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
        <p className="font-mono text-[11px]">© {year}</p>
      </div>
    </footer>
  );
}
