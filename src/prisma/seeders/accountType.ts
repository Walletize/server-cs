import { PrismaClient } from "@prisma/client"

export async function seedAccountTypes(prisma: PrismaClient) {
    await prisma.accountType.create({
        data: {
            id: "clx5u1bfc00002ae52il6rl6w",
            name: "Asset"
        },
    })

    await prisma.accountType.create({
        data: {
            id: "clx68w4qv0000hpx1ulkn0rof",
            name: "Liability"
        },
    })
}
