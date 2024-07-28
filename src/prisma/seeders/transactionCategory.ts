import { PrismaClient } from "@prisma/client"

export async function seedTransactionCategories(prisma: PrismaClient, userId: string) {
    await prisma.transactionCategory.create({
        data: {
            name: "Salary",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Business",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Gifts",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Insurance Payout",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Investments",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Loan",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Other",
            typeId: "a6f2747a-8d68-49f7-9aab-3a9dcaaee850",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Bills & Fees",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Entertainment",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Car",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Beauty",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Education",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Family & Personal",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Food & Drink",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Gifts",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Groceries",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Healthcare",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Home",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Shopping",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Sport & Hobbies",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Transport",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Travel",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Work",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });

    await prisma.transactionCategory.create({
        data: {
            name: "Other",
            typeId: "62919f5b-047d-45c7-96d9-1cd21a946d3a",
            userId: userId,
        },
    });
}
