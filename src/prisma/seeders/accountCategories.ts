import { PrismaClient } from "@prisma/client"

export async function seedAccountCategories(prisma: PrismaClient) {
    await prisma.accountCategory.create({
        data: {
            id: "clx69iur800015zn8ev6keudb",
            name: "Bank Account",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "clx69iura00035zn8w4m7l1gt",
            name: "Investment",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "clx69iurb00055zn8a3fq0rek",
            name: "Real Estate",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "clx68w4qv0000hncbdlkn0rof",
            name: "Loan",
            typeId: "clx68w4qv0000hpx1ulkn0rof",
        },
    })
}
