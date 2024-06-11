import { PrismaClient } from "@prisma/client"

export async function seedTransactionCategories(prisma: PrismaClient) {
    await prisma.transactionCategory.create({
        data: {
            id: "f22939a2-916e-4353-aa2d-51a400a007f3",
            name: "Salary",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
        },
    })

    await prisma.transactionCategory.create({
        data: {
            id: "94c3f747-d94b-426b-9363-d4c7f0243a95",
            name: "Entertainment",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    })
}
