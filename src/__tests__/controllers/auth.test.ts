import { it, expect, jest } from "@jest/globals";

jest.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../../lib/prisma";
import { setUpAccount } from "../../controller/auth";

const request = {
  body: {
    id: "id",
    role: "role",
  },
};
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
it("sends status code of 400 for invalid body", async () => {
  (prisma.user.update as jest.Mock).mockImplementationOnce(() => ({
    id: "id",
    role: "role",
    name: "username",
    email: "example@domain.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await setUpAccount(request, res);
});
