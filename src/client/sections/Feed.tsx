import { useEffect, useMemo, useState } from "react";
import type { PostEvent, PublicPersona } from "../lib/types.js";
import type { SimStreamState } from "../lib/useSimStream.js";

interface Props {
  simId: string;
  state: SimStreamState;
}

interface PostNode extends PostEvent {
  children: PostNode[];
}

function buildTree(posts: PostEvent[]): PostNode[] {
  const byId = new Map<string, PostNode>();
  for (const p of posts) byId.set(p.id, { ...p, children: [] });
  const roots: PostNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function relTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function PersonaAvatar({ persona, onClick }: { persona: PublicPersona; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-white"
      style={{ backgroundColor: persona.avatar.bg }}
      aria-label={`Open ${persona.name}'s profile`}
    >
      {persona.avatar.initials}
    </button>
  );
}

function PostCard({
  post,
  onPersonaClick,
}: {
  post: PostNode;
  onPersonaClick: (p: PublicPersona) => void;
}) {
  return (
    <article className="post-card flex gap-3">
      <PersonaAvatar persona={post.persona} onClick={() => onPersonaClick(post.persona)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-[13px]">
          <button
            type="button"
            onClick={() => onPersonaClick(post.persona)}
            className="font-semibold text-text hover:text-accent transition-colors"
          >
            {post.persona.name}
          </button>
          <span className="text-muted">{post.persona.handle}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{post.persona.location}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{relTime(post.createdAt)}</span>
        </div>
        <p className="mt-1 text-[15px] leading-snug text-text">{post.body}</p>
      </div>
    </article>
  );
}

function Thread({
  node,
  depth,
  onPersonaClick,
}: {
  node: PostNode;
  depth: number;
  onPersonaClick: (p: PublicPersona) => void;
}) {
  return (
    <div className={depth > 0 ? "border-l border-border pl-3 md:pl-4 ml-3 md:ml-4" : ""}>
      <PostCard post={node} onPersonaClick={onPersonaClick} />
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((c) => (
            <Thread
              key={c.id}
              node={c}
              depth={Math.min(depth + 1, 2)}
              onPersonaClick={onPersonaClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveTicker({ state }: { state: SimStreamState }) {
  const totalTurns = state.posts.length + state.skippedCount;
  const activePersonas = useMemo(
    () => new Set(state.posts.map((p) => p.personaId)).size,
    [state.posts],
  );
  return (
    <div className="flex items-center gap-3 font-mono text-[12px] text-muted">
      <span className={state.complete ? "" : "pulse-dot text-accent"} aria-hidden>
        ●
      </span>
      <span>
        {totalTurns} / 60 turns · {state.skippedCount} skipped · {activePersonas} personas active
      </span>
      {state.complete && <span className="text-accent">· complete</span>}
    </div>
  );
}

function PersonaPanel({
  persona,
  posts,
  onClose,
}: {
  persona: PublicPersona;
  posts: PostEvent[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const postCount = posts.filter((p) => p.personaId === persona.id).length;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
        aria-label="Close persona panel"
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] bg-card border-l border-border z-50 overflow-y-auto p-6"
        role="dialog"
        aria-labelledby="persona-panel-name"
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold text-white"
            style={{ backgroundColor: persona.avatar.bg }}
            aria-hidden
          >
            {persona.avatar.initials}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-accent text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <h2 id="persona-panel-name" className="mt-4 font-display text-2xl font-semibold">
          {persona.name}
        </h2>
        <p className="font-mono text-[13px] text-muted">{persona.handle}</p>
        <dl className="mt-6 space-y-3 text-[14px]">
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Age</dt>
            <dd className="text-text">{persona.age}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              Location
            </dt>
            <dd className="text-text">{persona.location}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              Occupation
            </dt>
            <dd className="text-text">{persona.occupation}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Bio</dt>
            <dd className="text-text leading-relaxed">{persona.bio}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Voice</dt>
            <dd className="text-text leading-relaxed">{persona.voice}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              Posts in this sim
            </dt>
            <dd className="text-text">{postCount}</dd>
          </div>
        </dl>
      </aside>
    </>
  );
}

function ExportButtons({ simId, enabled }: { simId: string; enabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={enabled ? `/api/sim/${simId}/transcript.md` : undefined}
        download={enabled ? `focusroom-${simId}.md` : undefined}
        aria-disabled={!enabled}
        className={`inline-flex items-center gap-2 px-4 py-2 border ${
          enabled
            ? "border-border text-text hover:border-accent hover:text-accent"
            : "border-border text-muted opacity-50 pointer-events-none"
        } transition-colors text-[14px]`}
      >
        Export Markdown
      </a>
      <a
        href={enabled ? `/api/sim/${simId}/transcript.json` : undefined}
        download={enabled ? `focusroom-${simId}.json` : undefined}
        aria-disabled={!enabled}
        className={`inline-flex items-center gap-2 px-4 py-2 border ${
          enabled
            ? "border-border text-text hover:border-accent hover:text-accent"
            : "border-border text-muted opacity-50 pointer-events-none"
        } transition-colors text-[14px]`}
      >
        Export JSON
      </a>
      {!enabled && (
        <span className="text-[12px] text-muted">Available when the simulation completes</span>
      )}
    </div>
  );
}

export function Feed({ simId, state }: Props) {
  const [active, setActive] = useState<PublicPersona | null>(null);
  const tree = useMemo(() => buildTree(state.posts), [state.posts]);

  return (
    <section className="max-w-page mx-auto px-6 py-8">
      <div className="max-w-content space-y-6">
        <LiveTicker state={state} />
        <div className="space-y-5">
          {tree.length === 0 ? (
            <p className="text-muted">Waiting for the first reaction...</p>
          ) : (
            tree.map((node) => (
              <Thread key={node.id} node={node} depth={0} onPersonaClick={setActive} />
            ))
          )}
        </div>
        <ExportButtons simId={simId} enabled={state.complete} />
      </div>
      {active && (
        <PersonaPanel persona={active} posts={state.posts} onClose={() => setActive(null)} />
      )}
    </section>
  );
}
