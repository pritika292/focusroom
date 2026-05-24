import { useState } from "react";
import { Header } from "./sections/Header.js";
import { Hero } from "./sections/Hero.js";
import { PromptForm } from "./sections/PromptForm.js";
import { PersonaGrid } from "./sections/PersonaGrid.js";
import { Upcoming } from "./sections/Upcoming.js";
import { Feed } from "./sections/Feed.js";
import { Footer } from "./sections/Footer.js";
import { useSimStream } from "./lib/useSimStream.js";
import { useVisitBeacon } from "./lib/visitBeacon.js";

export function App() {
  useVisitBeacon();
  const [simId, setSimId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const stream = useSimStream(simId);

  function handleNewSubmission(newSimId: string, submittedPrompt: string) {
    setPrompt(submittedPrompt);
    setSimId(newSimId);
  }

  function handleReset() {
    setSimId(null);
    setPrompt("");
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        {simId ? (
          <>
            <Feed simId={simId} prompt={prompt} state={stream} />
            <div className="max-w-page mx-auto px-6 lg:px-8 -mt-2">
              <button type="button" onClick={handleReset} className="fr-link-button">
                ← Run another simulation
              </button>
            </div>
          </>
        ) : (
          <>
            <PromptForm onSubmit={handleNewSubmission} />
            <PersonaGrid />
            <Upcoming />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
