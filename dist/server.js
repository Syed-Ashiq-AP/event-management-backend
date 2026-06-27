import dotenv from "dotenv";
dotenv.config();
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import express from "express";
import { auth } from "./lib/auth.js";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { randomUUID } from "crypto";
import { EventSchema, isValid } from "./lib/types.js";
import { requireAuth } from "./middleware/auth.js";
import { setUpAccount } from "./controller/auth.js";
const app = express();
const port = process.env.PORT ?? 8000;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? "http://localhost:5173.js";
// Cofigs
app.use(express.json());
app.use(cors({
    origin: FRONTEND_BASE_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.listen(port);
// Routes
// Auth Routes
app.all("/api/auth/*splat", toNodeHandler(auth));
// Healthy?
app.get("/api/health", (_, res) => {
    res.send("Healthy!");
});
app.use(requireAuth);
// User Routes
// Set up User Role
app.put("/api/set-up", setUpAccount);
// Event Routes
// create Event
app.post("/api/events", async (req, res) => {
    const eventRequest = req.body;
    if (!isValid(eventRequest, EventSchema)) {
        return res.status(500).json({ success: false, error: "INVALID_BODY" });
    }
    try {
        const event = await prisma.event.create({
            data: {
                id: randomUUID(),
                ...eventRequest,
            },
        });
        if (!event) {
            return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
        }
        return res.status(201).json({ success: true, event: event });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
        return res.status(500).json(e);
    }
});
// List Events
app.get("/api/events", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res
            .status(401)
            .json({ success: false, error: "Failed to get User Sessions" });
    const { id, role } = session.user;
    if (!role)
        return res.status(500).json({ success: false, error: "USER_NOT_SETUP_UP" });
    try {
        const events = role === "PARTICIPANT"
            ? await prisma.event.findMany({
                include: {
                    registrations: {
                        where: {
                            userId: id,
                        },
                        select: {
                            id: true,
                        },
                    },
                },
            })
            : await prisma.event.findMany({ where: { userId: id } });
        if (!events) {
            return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
        }
        return res.status(200).json({ success: true, events: events });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Update Event
app.put("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    const eventRequest = req.body;
    if (!isValid(eventRequest, EventSchema)) {
        return res.status(500).json({ error: "INVALID_BODY" });
    }
    try {
        const event = await prisma.event.update({
            data: eventRequest,
            where: { id },
        });
        if (!event) {
            return res.status(500).json({ error: "SOMETHING_WRONG" });
        }
        return res.status(200).json({ success: true, event: event });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Delete Event
app.delete("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res
            .status(401)
            .json({ success: false, error: "Failed to get User Sessions" });
    const { role } = session.user;
    if (!role)
        return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
    try {
        if (role === "PARTICIPANT") {
            const registrations = await prisma.registration.delete({
                where: { id },
            });
            if (!registrations) {
                return res
                    .status(500)
                    .json({ success: false, error: "SOMETHING_WRONG" });
            }
            return res.status(200).json({ success: true });
        }
        else if (role === "ORGANIZER") {
            const events = await prisma.event.delete({
                where: { id },
            });
            if (!events) {
                return res.status(500).json({ error: "SOMETHING_WRONG" });
            }
            return res.status(200).json({ success: true });
        }
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Event Analytics
app.get("/api/analytics", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res.status(401).json({ error: "Failed to get User Sessions" });
    const { id: userId } = session.user;
    try {
        const eventIds = (await prisma.event.findMany({ select: { id: true }, where: { userId } })).map((obj) => obj.id);
        const registrationsCount = await prisma.registration.count({
            where: { userId, eventId: { in: eventIds } },
        });
        const attendanceCount = await prisma.registration.count({
            where: { userId, attended: true, eventId: { in: eventIds } },
        });
        return res.status(200).json({
            success: true,
            analytics: {
                eventsCount: eventIds.length,
                registrationsCount,
                attendanceCount,
            },
        });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Register Routes
// Register to Event
app.post("/api/events/:eventId", async (req, res) => {
    const { eventId } = req.params;
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res
            .status(401)
            .json({ success: false, error: "Failed to get User Sessions" });
    const { id: userId } = session.user;
    try {
        const registration = await prisma.registration.create({
            data: { id: randomUUID(), userId, eventId },
        });
        if (!registration) {
            return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
        }
        return res.status(201).json({ success: true, registration: registration });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Get Registrations
app.get("/api/registrations", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res
            .status(401)
            .json({ success: false, error: "Failed to get User Sessions" });
    const { id: userId } = session.user;
    try {
        const registrations = await prisma.registration.findMany({
            where: { userId },
            include: {
                event: true,
            },
        });
        if (!registrations) {
            return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
        }
        return res
            .status(200)
            .json({ success: true, registrations: registrations });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Attendance routes
// Attended
app.put("/api/registrations/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const registration = await prisma.registration.update({
            data: { attended: true },
            where: { id },
        });
        return res.status(201).json({ success: true, registration: registration });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
// Valid registrations for certificate
app.get("/api/certificates", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session)
        return res
            .status(401)
            .json({ success: false, error: "Failed to get User Sessions" });
    const { id: userId } = session.user;
    try {
        const certificates = await prisma.registration.findMany({
            where: {
                userId,
                attended: true,
            },
            include: {
                event: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!certificates) {
            return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
        }
        return res.status(200).json({ success: true, certificates });
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({
                name: e.name,
                message: e.message,
                stack: e.stack,
            });
        }
    }
});
