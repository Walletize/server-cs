import { PrismaClient } from "@prisma/client"

export async function seedAccountCategories(prisma: PrismaClient, userId: string) {
    await prisma.accountCategory.create({
        data: {
            name: "Savings Account",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "landmark.svg",
            color: "#18b272",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Checking Account",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "landmark.svg",
            color: "#45a7e6",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Cash",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "banknote.svg",
            color: "#72c541",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Stocks",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "chart-spline.svg",
            color: "#18b272",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Cryptocurrencies",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "badge-cent.svg",
            color: "#ffa801",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Real Estate",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "house.svg",
            color: "#a34048",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Vehicle",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "car.svg",
            color: "#5e5fbf",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Retirement Accounts",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "user.svg",
            color: "#4ebab3",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Gold",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "weight.svg",
            color: "#e8b923",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Insurance",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "shield.svg",
            color: "#6baab3",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Collectibles",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "shapes.svg",
            color: "#e30b5d",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Other",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
            userId: userId,
            icon: "ellipsis.svg",
            color: "#27272a",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Loan",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
            icon: "hand-coins.svg",
            color: "#dc143c",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Credit Card",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
            icon: "credit-card.svg",
            color: "#e8b923",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Bills",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
            icon: "receipt.svg",
            color: "#007b17",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Mortgage",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
            icon: "house.svg",
            color: "#a30086",
            iconColor: "white",
        },
    })

    await prisma.accountCategory.create({
        data: {
            name: "Other",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
            userId: userId,
            icon: "ellipsis.svg",
            color: "#27272a",
            iconColor: "white",
        },
    })
}
