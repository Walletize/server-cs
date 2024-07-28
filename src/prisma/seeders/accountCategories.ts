import { PrismaClient } from "@prisma/client"

export async function seedAccountCategories(prisma: PrismaClient, userId: string) {
    await prisma.accountCategory.create({
        data: {
            name: "Checking Account",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Savings Account",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Cash",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Stocks",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Cryptocurrencies",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Real Estate",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Vehicle",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Retirement Accounts",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Gold",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Insurance",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Collectibles",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Other",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Loan",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Credit Card",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Bills",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Mortgage",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Other",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
        },
    })
}
