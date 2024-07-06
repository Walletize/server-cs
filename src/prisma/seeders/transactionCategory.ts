import { PrismaClient } from "@prisma/client"

export async function seedTransactionCategories(prisma: PrismaClient) {
    await prisma.transactionCategory.create({
        data: {
            name: "Gain",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Loss",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "In Walletize",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Out of Walletize",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
        },
    });
}
