import { PrismaTestingHelper } from "@chax-at/transactional-prisma-testing";
import type { PrismaClient } from "@prisma/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { prisma } from "../lib/prisma.js";

let prismaTestingHelper: PrismaTestingHelper<PrismaClient>;
let testPrisma: PrismaClient;

async function createServerFixtures(tx: PrismaClient) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const organizerId = `organizer-${uniqueId}`;
  const participantId = `participant-${uniqueId}`;
  const eventId = `event-${uniqueId}`;
  const registrationId = `registration-${uniqueId}`;

  const organizer = await tx.user.create({
    data: {
      id: organizerId,
      name: "Organizer User",
      email: `organizer-${uniqueId}@example.com`,
      emailVerified: true,
      role: "ORGANIZER",
    },
  });

  const participant = await tx.user.create({
    data: {
      id: participantId,
      name: "Participant User",
      email: `participant-${uniqueId}@example.com`,
      emailVerified: true,
      role: "PARTICIPANT",
    },
  });

  const event = await tx.event.create({
    data: {
      id: eventId,
      title: "Server Prisma Test Event",
      description: "Created by prisma.test.ts",
      location: "Chennai",
      status: "OPEN",
      userId: organizer.id,
      eventDate: new Date("2026-08-15T09:00:00.000Z"),
    },
  });

  const registration = await tx.registration.create({
    data: {
      id: registrationId,
      userId: participant.id,
      eventId: event.id,
    },
  });

  return {
    organizer,
    participant,
    event,
    registration,
    ids: {
      organizerId,
      participantId,
      eventId,
      registrationId,
    },
  };
}

beforeAll(() => {
  prismaTestingHelper = new PrismaTestingHelper(prisma);
  testPrisma = prismaTestingHelper.getProxyClient();
});

beforeEach(async () => {
  await prismaTestingHelper.startNewTransaction({
    maxWait: 30000,
    timeout: 60000,
  });
});

afterEach(() => {
  prismaTestingHelper.rollbackCurrentTransaction();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PUT /api/set-up", () => {
  test("Case: valid user and role", async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userId = `setup-user-${uniqueId}`;

    await testPrisma.user.create({
      data: {
        id: userId,
        name: "Setup User",
        email: `setup-${uniqueId}@example.com`,
        emailVerified: false,
      },
    });

    const user = await testPrisma.user.update({
      data: { role: "ORGANIZER" },
      where: { id: userId },
    });

    expect(user.role).toBe("ORGANIZER");
  });
});

describe("POST /api/events", () => {
  test("Case: valid event", async () => {
    const { organizer, event } = await createServerFixtures(testPrisma);

    const organizerEvents = await testPrisma.event.findMany({
      where: { userId: organizer.id },
    });

    expect(organizerEvents).toHaveLength(1);
    expect(organizerEvents[0]).toMatchObject({
      id: event.id,
      title: "Server Prisma Test Event",
      userId: organizer.id,
    });
  });
});

describe("GET /api/events", () => {
  test("Case: valid organizer and participant events", async () => {
    const { organizer, participant, event, registration } =
      await createServerFixtures(testPrisma);

    const organizerEvents = await testPrisma.event.findMany({
      where: { userId: organizer.id },
    });

    expect(organizerEvents).toEqual([
      expect.objectContaining({
        id: event.id,
        userId: organizer.id,
      }),
    ]);

    const participantEvents = await testPrisma.event.findMany({
      include: {
        registrations: {
          where: {
            userId: participant.id,
          },
          select: {
            id: true,
          },
        },
      },
    });

    expect(participantEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: event.id,
          registrations: [{ id: registration.id }],
        }),
      ]),
    );
  });
});

describe("PUT /api/events/:id", () => {
  test("Case: valid event", async () => {
    const { organizer, event } = await createServerFixtures(testPrisma);

    const updatedEvent = await testPrisma.event.update({
      data: {
        title: "Updated Server Prisma Test Event",
        description: "Updated inside rollback transaction.",
        location: "Bengaluru",
        status: "IN_PROGRESS",
        userId: organizer.id,
        eventDate: new Date("2026-09-20T10:00:00.000Z"),
      },
      where: { id: event.id },
    });

    expect(updatedEvent).toMatchObject({
      id: event.id,
      title: "Updated Server Prisma Test Event",
      location: "Bengaluru",
      status: "IN_PROGRESS",
    });
  });
});

describe("POST /api/events/:eventId", () => {
  test("Case: valid registration", async () => {
    const { participant, event } = await createServerFixtures(testPrisma);
    const registrationId = `new-registration-${event.id}`;

    const registration = await testPrisma.registration.create({
      data: {
        id: registrationId,
        userId: participant.id,
        eventId: event.id,
      },
    });

    expect(registration).toMatchObject({
      id: registrationId,
      userId: participant.id,
      eventId: event.id,
      attended: false,
    });
  });
});

describe("GET /api/registrations", () => {
  test("Case: valid registrations", async () => {
    const { participant, event, registration } =
      await createServerFixtures(testPrisma);

    const registrations = await testPrisma.registration.findMany({
      where: { userId: participant.id },
      include: {
        event: true,
      },
    });

    expect(registrations).toEqual([
      expect.objectContaining({
        id: registration.id,
        userId: participant.id,
        eventId: event.id,
        event: expect.objectContaining({ id: event.id }),
      }),
    ]);
  });
});

describe("PUT /api/registrations/:id", () => {
  test("Case: mark attended", async () => {
    const { registration } = await createServerFixtures(testPrisma);

    const attendedRegistration = await testPrisma.registration.update({
      data: { attended: true },
      where: { id: registration.id },
    });

    expect(attendedRegistration.attended).toBe(true);
  });
});

describe("DELETE /api/events/:id", () => {
  test("Case: participant deletes registration", async () => {
    const { registration } = await createServerFixtures(testPrisma);

    const deletedRegistration = await testPrisma.registration.delete({
      where: { id: registration.id },
    });

    expect(deletedRegistration.id).toBe(registration.id);
    await expect(
      testPrisma.registration.findUnique({ where: { id: registration.id } }),
    ).resolves.toBeNull();
  });
});

describe("DELETE /api/events/:id", () => {
  test("Case: organizer deletes event", async () => {
    const { event, registration } = await createServerFixtures(testPrisma);

    const deletedEvent = await testPrisma.event.delete({
      where: { id: event.id },
    });

    expect(deletedEvent.id).toBe(event.id);
    await expect(testPrisma.event.findUnique({ where: { id: event.id } }))
      .resolves.toBeNull();
    await expect(
      testPrisma.registration.findUnique({ where: { id: registration.id } }),
    ).resolves.toBeNull();
  });
});

describe("GET /api/analytics", () => {
  test("Case: valid analytics", async () => {
    const { organizer, event } = await createServerFixtures(testPrisma);
    const organizerRegistrationId = `organizer-registration-${event.id}`;

    await testPrisma.registration.create({
      data: {
        id: organizerRegistrationId,
        userId: organizer.id,
        eventId: event.id,
        attended: true,
      },
    });

    const eventIds = (
      await testPrisma.event.findMany({
        select: { id: true },
        where: { userId: organizer.id },
      })
    ).map((obj) => obj.id);

    const registrationsCount = await testPrisma.registration.count({
      where: { userId: organizer.id, eventId: { in: eventIds } },
    });

    const attendanceCount = await testPrisma.registration.count({
      where: {
        userId: organizer.id,
        attended: true,
        eventId: { in: eventIds },
      },
    });

    expect(eventIds).toEqual([event.id]);
    expect(registrationsCount).toBe(1);
    expect(attendanceCount).toBe(1);
  });
});

describe("GET /api/certificates", () => {
  test("Case: valid certificates", async () => {
    const { organizer, participant, event, registration } =
      await createServerFixtures(testPrisma);

    await testPrisma.registration.update({
      data: { attended: true },
      where: { id: registration.id },
    });

    const certificates = await testPrisma.registration.findMany({
      where: {
        userId: participant.id,
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

    expect(certificates).toEqual([
      expect.objectContaining({
        id: registration.id,
        event: expect.objectContaining({
          id: event.id,
          user: {
            name: organizer.name,
          },
        }),
      }),
    ]);
  });
});
