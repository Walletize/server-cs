import { PrismaClient } from '@prisma/client';

export async function seedSubscriptionTypes(prisma: PrismaClient) {
  await prisma.accountType.create({
    data: {
      id: '4ff2b533-f5c9-4a9f-a1a9-a43b61bb7deb',
      name: 'Premium',
    },
  });
}
