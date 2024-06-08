import { PrismaClient } from "@prisma/client"

export async function seedAccountSubtypes(prisma: PrismaClient) {
    await prisma.accountSubtype.create({
        data: {
            id: "clx69iur800015zn8ev6keudb",
            name: "Bank Account",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })

    await prisma.accountSubtype.create({
        data: {
            id: "clx69iura00035zn8w4m7l1gt",
            name: "Investment",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })

    await prisma.accountSubtype.create({
        data: {
            id: "clx69iurb00055zn8a3fq0rek",
            name: "Real Estate",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })
}
