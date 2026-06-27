import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

async function setUpAccount(req: Request, res: Response) {
  const { id, role } = req.body as {
    id: string;
    role: "PARTICIPANT" | "ORGANIZER";
  };
  if (!id || !role)
    return res.status(500).json({ success: false, error: "INVALID_BODY" });

  const user = await prisma.user.update({ data: { role }, where: { id } });
  if (user) return res.status(201).json({ success: true, user: user });
  return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
}

export { setUpAccount };
