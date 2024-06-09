import { PrismaClient } from "@prisma/client"

export async function seedTransactionTypes(prisma: PrismaClient) {
    await prisma.accountType.create({
        data: {
            id: "clx5u1bfc00002kdmail6rl6w",
            name: "Income"
        },
    })

    await prisma.accountType.create({
        data: {
            id: "clx68w4qv0000hpxmn8kfgrof",
            name: "Expense"
        },
    })

    await prisma.accountType.create({
        data: {
            id: "clx68w4qv0000hpxm9kgmiehg",
            name: "Transfer"
        },
    })
}
