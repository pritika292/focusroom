import { Router, type Request, type Response } from "express";
import { PERSONAS } from "../personas.js";

export const personasRouter = Router();

personasRouter.get("/api/personas", (_req: Request, res: Response) => {
  res.json({
    personas: PERSONAS.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      avatar: p.avatar,
      age: p.age,
      location: p.location,
      occupation: p.occupation,
      bio: p.bio,
      voice: p.voice,
    })),
  });
});
