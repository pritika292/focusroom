export interface PublicPersona {
  id: string;
  name: string;
  handle: string;
  avatar: { initials: string; bg: string };
  location: string;
  occupation: string;
  age: number;
  bio: string;
  voice: string;
}

export interface PostEvent {
  id: string;
  simId: string;
  personaId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  persona: PublicPersona;
}

export interface TurnSkippedEvent {
  simId: string;
  personaId: string;
  persona: PublicPersona;
}

export interface SimCompleteEvent {
  simId: string;
  postCount: number;
  silentTurns: number;
}
