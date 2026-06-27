import { prisma } from "../lib/prisma";
async function setUpAccount(req, res) {
    const { id, role } = req.body;
    if (!id || !role)
        return res.status(500).json({ success: false, error: "INVALID_BODY" });
    const user = await prisma.user.update({ data: { role }, where: { id } });
    if (user)
        return res.status(201).json({ success: true, user: user });
    return res.status(500).json({ success: false, error: "SOMETHING_WRONG" });
}
export { setUpAccount };
//# sourceMappingURL=auth.js.map