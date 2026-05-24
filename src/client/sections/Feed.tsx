import { useEffect, useMemo, useState } from "react";
import type { PostEvent, PublicPersona } from "../lib/types.js";
import type { SimStreamState } from "../lib/useSimStream.js";

interface Props {
  simId: string;
  prompt: string;
  state: SimStreamState;
}

interface PostNode extends PostEvent {
  children: PostNode[];
  rootId: string;
}

function buildTree(posts: PostEvent[]): PostNode[] {
  const byId = new Map<string, PostNode>();
  for (const p of posts) byId.set(p.id, { ...p, children: [], rootId: p.id });
  const roots: PostNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) {
        node.rootId = parent.rootId;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
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

function PersonaAvatar({
  persona,
  onClick,
  size = 40,
}: {
  persona: PublicPersona;
  onClick: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fr-avatar"
      style={{
        backgroundColor: persona.avatar.bg,
        width: size,
        height: size,
        fontSize: size <= 28 ? 11 : 13,
      }}
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
    <article className="ig-comment">
      <PersonaAvatar
        persona={post.persona}
        onClick={() => onPersonaClick(post.persona)}
        size={32}
      />
      <div className="ig-comment__body">
        <p className="ig-comment__line">
          <button
            type="button"
            onClick={() => onPersonaClick(post.persona)}
            className="ig-comment__name"
          >
            {post.persona.name.toLowerCase().replace(/\s+/g, "_")}
          </button>
          <span className="ig-comment__text">{post.body}</span>
        </p>
        <p className="ig-comment__meta">
          <span>{relTime(post.createdAt)}</span>
          <span aria-hidden>·</span>
          <span>{post.persona.location}</span>
        </p>
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
    <div className={depth > 0 ? "ig-reply" : ""}>
      <PostCard post={node} onPersonaClick={onPersonaClick} />
      {node.children.length > 0 && (
        <div className="ig-thread-children">
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
  const pct = Math.min(100, Math.round((totalTurns / 60) * 100));
  return (
    <div className="fr-ticker">
      <div className="fr-ticker__row">
        <div className="fr-ticker__status font-mono">
          <span
            className={state.complete ? "fr-ticker__dot--done" : "fr-ticker__dot pulse-dot"}
            aria-hidden
          />
          <span>{state.complete ? "complete" : "live"}</span>
        </div>
        <div className="fr-ticker__counts font-mono">
          <span>
            <span className="text-text">{totalTurns}</span>
            <span className="text-muted"> / 60 turns</span>
          </span>
          <span className="text-muted">·</span>
          <span>
            <span className="text-text">{state.skippedCount}</span>
            <span className="text-muted"> skipped</span>
          </span>
          <span className="text-muted">·</span>
          <span>
            <span className="text-text">{activePersonas}</span>
            <span className="text-muted"> personas active</span>
          </span>
        </div>
      </div>
      <div className="fr-ticker__bar" aria-hidden>
        <div className="fr-ticker__bar-fill" style={{ width: `${pct}%` }} />
      </div>
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
        className="fr-panel-backdrop"
        aria-label="Close persona panel"
      />
      <aside className="fr-panel" role="dialog" aria-labelledby="persona-panel-name">
        <button type="button" onClick={onClose} className="fr-panel__close" aria-label="Close">
          ×
        </button>
        <div
          className="fr-panel__hero"
          style={{
            background: `linear-gradient(180deg, ${persona.avatar.bg}33 0%, transparent 100%)`,
          }}
        >
          <div
            className="fr-panel__avatar"
            style={{ backgroundColor: persona.avatar.bg }}
            aria-hidden
          >
            {persona.avatar.initials}
          </div>
          <h2 id="persona-panel-name" className="fr-panel__name font-display">
            {persona.name}
          </h2>
          <p className="fr-panel__handle font-mono">{persona.handle}</p>
        </div>
        <dl className="fr-panel__dl">
          <div>
            <dt>Age</dt>
            <dd>{persona.age}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{persona.location}</dd>
          </div>
          <div>
            <dt>Occupation</dt>
            <dd>{persona.occupation}</dd>
          </div>
          <div>
            <dt>Bio</dt>
            <dd>{persona.bio}</dd>
          </div>
          <div>
            <dt>Voice</dt>
            <dd>{persona.voice}</dd>
          </div>
          <div>
            <dt>Posts in this sim</dt>
            <dd>{postCount}</dd>
          </div>
        </dl>
      </aside>
    </>
  );
}

function ExportButtons({
  simId,
  enabled,
  compact,
}: {
  simId: string;
  enabled: boolean;
  compact?: boolean;
}) {
  const cls = compact ? "fr-btn-ghost fr-btn-ghost--sm" : "fr-btn-ghost";
  return (
    <div className={compact ? "fr-export fr-export--compact" : "fr-export"}>
      <a
        href={enabled ? `/api/sim/${simId}/transcript.md` : undefined}
        download={enabled ? `focusroom-${simId}.md` : undefined}
        aria-disabled={!enabled}
        className={`${cls} ${enabled ? "" : "is-disabled"}`}
        title={enabled ? "Download Markdown transcript" : "Available when the simulation completes"}
      >
        <DownloadIcon /> {compact ? "MD" : "Markdown"}
      </a>
      <a
        href={enabled ? `/api/sim/${simId}/transcript.json` : undefined}
        download={enabled ? `focusroom-${simId}.json` : undefined}
        aria-disabled={!enabled}
        className={`${cls} ${enabled ? "" : "is-disabled"}`}
        title={enabled ? "Download JSON transcript" : "Available when the simulation completes"}
      >
        <DownloadIcon /> {compact ? "JSON" : "JSON"}
      </a>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function OriginalPost({ prompt }: { prompt: string }) {
  return (
    <article className="ig-post">
      <header className="ig-post__head">
        <div className="ig-post__avatar" aria-hidden>
          P
        </div>
        <div>
          <p className="ig-post__name">you</p>
          <p className="ig-post__meta">just now</p>
        </div>
      </header>
      <p className="ig-post__body">{prompt}</p>
    </article>
  );
}

export function Feed({ simId, prompt, state }: Props) {
  const [active, setActive] = useState<PublicPersona | null>(null);
  const tree = useMemo(() => buildTree(state.posts), [state.posts]);
  const commentCount = state.posts.length;

  return (
    <section className="max-w-page mx-auto px-6 pt-2 pb-12">
      <div className="ig-shell">
        <OriginalPost prompt={prompt} />
        <LiveTicker state={state} />
        <div className="ig-comments-head">
          <span className="font-mono">
            <span className="text-text">{commentCount}</span>
            <span className="text-muted"> comment{commentCount === 1 ? "" : "s"}</span>
          </span>
          <ExportButtons simId={simId} enabled={state.complete} compact />
        </div>
        <div className="ig-comments">
          {tree.length === 0 ? (
            <div className="fr-empty">
              <span className="pulse-dot text-accent" aria-hidden>
                ●
              </span>
              <span>Waiting for the first reaction...</span>
            </div>
          ) : (
            tree.map((node) => (
              <Thread key={node.id} node={node} depth={0} onPersonaClick={setActive} />
            ))
          )}
        </div>
        {state.complete && (
          <div className="ig-complete">
            <span className="font-mono text-[12px] text-muted">simulation complete</span>
            <ExportButtons simId={simId} enabled />
          </div>
        )}
      </div>
      {active && (
        <PersonaPanel persona={active} posts={state.posts} onClose={() => setActive(null)} />
      )}
    </section>
  );
}
