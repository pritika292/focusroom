import { useState } from "react";
import { Header } from "./sections/Header.js";
import { Hero } from "./sections/Hero.js";
import { PromptForm } from "./sections/PromptForm.js";
import { Feed } from "./sections/Feed.js";
import { Footer } from "./sections/Footer.js";
import { useSimStream } from "./lib/useSimStream.js";

export function App() {
  const [simId, setSimId] = useState<string | null>(null);
  const stream = useSimStream(simId);

  function handleNewSubmission(newSimId: string) {
    setSimId(newSimId);
  }

  function handleReset() {
    setSimId(null);
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        {simId ? (
          <>
            <Feed simId={simId} state={stream} />
            <div className="max-w-page mx-auto px-6 -mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-[13px] text-muted hover:text-accent transition-colors underline underline-offset-4"
              >
                Run another simulation
              </button>
            </div>
          </>
        ) : (
          <PromptForm onSubmit={handleNewSubmission} />
        )}
      </main>
      <Footer />
    </>
  );
}
