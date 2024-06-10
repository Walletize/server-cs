import { PrismaClient } from "@prisma/client"

export async function seedTransactionCategories(prisma: PrismaClient) {
    await prisma.transactionCategory.create({
        data: {
            id: "94c3f747-d94b-426b-9363-d4c7f0243a95",
            name: "Entertainment",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    })
}
