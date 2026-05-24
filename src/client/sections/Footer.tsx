export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="max-w-page mx-auto px-6 lg:px-8 py-12 mt-12 border-t border-border">
      <div className="max-w-content space-y-3 text-[14px] text-muted leading-relaxed">
        <p>
          Twenty distinct voices, each with their own demographics, opinions, and writing style.
          They argue, agree, scroll past, or pile on, the way a real comment section does.
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
