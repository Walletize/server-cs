import { PrismaClient } from "@prisma/client"

export async function seedTransactionCategories(prisma: PrismaClient) {
    await prisma.accountCategory.create({
        data: {
            id: "clx69iur800015zn8ev6keudb",
            name: "Bank Account",
            typeId: "clx5u1bfc00002ae52il6rl6w",
        },
    })
}
