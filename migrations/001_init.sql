-- 001_init.sql -- FocusRoom v1 schema.
-- Schema is created by the bootstrap-vm.sh role-grant step. This file
-- owns the tables + indexes. gen_random_uuid() is built into PG 13+
-- so we don't need the pgcrypto extension (which would require
-- superuser to install).

CREATE TABLE IF NOT EXISTS focusroom.simulations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt              TEXT NOT NULL,
  ip                  INET,
  status              TEXT NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running','complete','blocked_prompt_shield','error','orphaned')),
  blocked_by_shield   BOOLEAN NOT NULL DEFAULT FALSE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  post_count          INTEGER NOT NULL DEFAULT 0,
  silent_turns        INTEGER NOT NULL DEFAULT 0,
  dropped_count       INTEGER NOT NULL DEFAULT 0,
  total_tokens_in     INTEGER NOT NULL DEFAULT 0,
  total_tokens_out    INTEGER NOT NULL DEFAULT 0,
  total_cost_cents    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS focusroom.posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_id          UUID NOT NULL REFERENCES focusroom.simulations(id) ON DELETE CASCADE,
  persona_id      TEXT NOT NULL,
  parent_post_id  UUID REFERENCES focusroom.posts(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  tokens_in       INTEGER NOT NULL DEFAULT 0,
  tokens_out      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate-limiter lookup: sims by IP in the last hour
CREATE INDEX IF NOT EXISTS simulations_ip_started_at_idx
  ON focusroom.simulations (ip, started_at DESC);

-- Daily-budget query: today's sims by start time
CREATE INDEX IF NOT EXISTS simulations_started_at_idx
  ON focusroom.simulations (started_at DESC);

-- SSE backlog replay + transcript export: posts in a sim, ordered by time
CREATE INDEX IF NOT EXISTS posts_sim_id_created_at_idx
  ON focusroom.posts (sim_id, created_at);

-- Context builder ancestor walk: replies under a given parent
CREATE INDEX IF NOT EXISTS posts_parent_post_id_idx
  ON focusroom.posts (parent_post_id);
