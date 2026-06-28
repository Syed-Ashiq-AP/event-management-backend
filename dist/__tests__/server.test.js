import { describe, test, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    updateUser: vi.fn(),
    createEvent: vi.fn(),
    findEvents: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    createRegistration: vi.fn(),
    findRegistrations: vi.fn(),
    updateRegistration: vi.fn(),
    deleteRegistration: vi.fn(),
    countRegistrations: vi.fn(),
    findEventIds: vi.fn(),
}));
vi.mock("../lib/auth.js", () => ({
    auth: {
        api: {
            getSession: mocks.getSession,
        },
    },
}));
vi.mock("../lib/prisma.js", () => ({
    prisma: {
        user: {
            update: mocks.updateUser,
            findUnique: vi.fn(),
        },
        event: {
            create: mocks.createEvent,
            findMany: mocks.findEvents,
            update: mocks.updateEvent,
            delete: mocks.deleteEvent,
            findUnique: vi.fn(),
        },
        registration: {
            create: mocks.createRegistration,
            findMany: mocks.findRegistrations,
            update: mocks.updateRegistration,
            delete: mocks.deleteRegistration,
            count: mocks.countRegistrations,
        },
    },
}));
import { prisma } from "../lib/prisma.js";
import request from "supertest";
import app from "../server.js";
const mockUser = {
    id: "user-1",
    name: "Bob",
    email: "bob@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    role: "ORGANIZER",
};
const mockEvent = {
    id: "event-1",
    title: "Event 1",
    description: "Event Description.",
    location: "Chennai",
    status: "OPEN",
    userId: "user-1",
    eventDate: new Date("2026-08-15T09:00:00.000Z"),
    createdAt: new Date("2026-06-01T10:30:00.000Z"),
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
        user: mockUser,
    });
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser);
    vi.mocked(prisma.event.create).mockResolvedValue(mockEvent);
    vi.mocked(prisma.event.findMany).mockResolvedValue([mockEvent]);
});
describe("PUT /api/set-up", () => {
    describe("500 Errors", () => {
        test("Case: Valid Request", async () => {
            const response = await request(app).put("/api/set-up").send({});
            expect(response.body).toEqual({ success: false, error: "INVALID_BODY" });
        });
    });
    describe("201 Accepted", () => {
        test("Case: valid user and id", async () => {
            const response = await request(app).put("/api/set-up").send({
                id: "user-1",
                role: "ORGANIZER",
            });
            expect(response.body).toEqual({
                success: true,
                user: {
                    ...mockUser,
                    createdAt: mockUser.createdAt.toISOString(),
                    updatedAt: mockUser.updatedAt.toISOString(),
                },
            });
        });
    });
});
describe("POST /api/events", () => {
    describe("500 Errors", () => {
        test("Case: Valid Request", async () => {
            const response = await request(app).post("/api/events").send({});
            expect(response.body).toEqual({ success: false, error: "INVALID_BODY" });
        });
    });
    describe("201 Accepted", () => {
        test("Case: valid user and id", async () => {
            const { id: _, createdAt: __, ...requestBody } = mockEvent;
            const response = await request(app).post("/api/events").send(requestBody);
            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual({
                success: true,
                event: {
                    ...mockEvent,
                    createdAt: mockEvent.createdAt.toISOString(),
                    eventDate: mockEvent.eventDate.toISOString(),
                },
            });
        });
    });
});
describe("GET /api/events", () => {
    describe("500 Errors", () => {
        test("Case: Invalid session", async () => {
            mocks.getSession.mockResolvedValueOnce(null);
            const response = await request(app).get("/api/events").send({});
            expect(response.statusCode).toBe(401);
        });
    });
    describe("201 Accepted", () => {
        test("Case: valid user and id", async () => {
            const response = await request(app).get("/api/events").send({});
            expect(response.statusCode).toBe(200);
        });
    });
});
describe("PUT /api/events/:id", () => {
    beforeEach(() => {
        vi.mocked(prisma.event.update).mockResolvedValue(mockEvent);
    });
    describe("500 Errors", () => {
        test("Case: Invalid Body", async () => {
            const response = await request(app).put("/api/events/event-1").send({});
            expect(response.body).toEqual({
                error: "INVALID_BODY",
            });
        });
    });
    describe("200 Accepted", () => {
        test("Case: valid event", async () => {
            const { id: _, createdAt: __, ...body } = mockEvent;
            const response = await request(app).put("/api/events/event-1").send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                success: true,
                event: {
                    ...mockEvent,
                    createdAt: mockEvent.createdAt.toISOString(),
                    eventDate: mockEvent.eventDate.toISOString(),
                },
            });
        });
    });
});
describe("DELETE /api/events/:id", () => {
    describe("200 Accepted", () => {
        test("Case: Organizer deletes event", async () => {
            vi.mocked(prisma.event.delete).mockResolvedValue(mockEvent);
            const response = await request(app).delete("/api/events/event-1");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                success: true,
            });
        });
        test("Case: Participant deletes registration", async () => {
            mocks.getSession.mockResolvedValueOnce({
                user: {
                    ...mockUser,
                    role: "PARTICIPANT",
                },
            });
            vi.mocked(prisma.registration.delete).mockResolvedValue({
                id: "registration-1",
                userId: mockUser.id,
                eventId: mockEvent.id,
                attended: false,
                registeredAt: new Date(),
            });
            const response = await request(app).delete("/api/events/registration-1");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                success: true,
            });
        });
    });
});
describe("GET /api/analytics", () => {
    beforeEach(() => {
        vi.mocked(prisma.event.findMany).mockResolvedValue([
            { id: "event-1" },
        ]);
        vi.mocked(prisma.registration.count)
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(7);
    });
    describe("200 Accepted", () => {
        test("Case: valid analytics", async () => {
            const response = await request(app).get("/api/analytics");
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                success: true,
                analytics: {
                    eventsCount: 1,
                    registrationsCount: 10,
                    attendanceCount: 7,
                },
            });
        });
    });
});
describe("POST /api/events/:eventId", () => {
    beforeEach(() => {
        vi.mocked(prisma.registration.create).mockResolvedValue({
            id: "registration-1",
            userId: mockUser.id,
            eventId: mockEvent.id,
            attended: false,
            registeredAt: new Date(),
        });
    });
    describe("201 Accepted", () => {
        test("Case: valid registration", async () => {
            const response = await request(app).post("/api/events/event-1");
            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });
});
describe("GET /api/registrations", () => {
    beforeEach(() => {
        vi.mocked(prisma.registration.findMany).mockResolvedValue([
            {
                id: "registration-1",
                userId: mockUser.id,
                eventId: mockEvent.id,
                attended: false,
                registeredAt: new Date(),
                event: mockEvent,
            },
        ]);
    });
    describe("200 Accepted", () => {
        test("Case: valid registrations", async () => {
            const response = await request(app).get("/api/registrations");
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
describe("PUT /api/registrations/:id", () => {
    beforeEach(() => {
        vi.mocked(prisma.registration.update).mockResolvedValue({
            id: "registration-1",
            userId: mockUser.id,
            eventId: mockEvent.id,
            attended: true,
            registeredAt: new Date(),
        });
    });
    describe("201 Accepted", () => {
        test("Case: mark attended", async () => {
            const response = await request(app).put("/api/registrations/registration-1");
            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });
});
describe("GET /api/certificates", () => {
    beforeEach(() => {
        vi.mocked(prisma.registration.findMany).mockResolvedValue([
            {
                id: "registration-1",
                userId: mockUser.id,
                eventId: mockEvent.id,
                attended: true,
                registeredAt: new Date(),
                event: {
                    ...mockEvent,
                    user: {
                        name: "Bob",
                    },
                },
            },
        ]);
    });
    describe("200 Accepted", () => {
        test("Case: valid certificates", async () => {
            const response = await request(app).get("/api/certificates");
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
