import { PrismaClient } from "@prisma/client"

export async function seedAccountCategories(prisma: PrismaClient) {
    await prisma.accountCategory.create({
        data: {
            id: "ff23e0bc-9e9a-4c63-a49b-c4a74ced6410",
            name: "Bank Account",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "09c66fdd-c535-459e-b8cd-938a29e27f71",
            name: "Investment",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "36d773ba-3f9d-4916-9410-251915708ad7",
            name: "Real Estate",
            icon: "",
            typeId: "590cf50e-09a5-414c-9444-a716b14d210f",
        },
    })

    await prisma.accountCategory.create({
        data: {
            id: "85f7d600-0ee1-4ee7-b57a-ef0f71fa6323",
            name: "Loan",
            icon: "",
            typeId: "645349f8-6b34-420c-91ef-c058eb065f2d",
        },
    })
}
