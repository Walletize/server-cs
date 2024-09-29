import { PrismaClient } from '@prisma/client';

export async function seedPlans(prisma: PrismaClient) {
  await prisma.plan.create({
    data: {
      id: 0,
      name: 'Pro',
      price: 0.99,
      billingCycle: 'MONTHLY',
    },
  });

  await prisma.plan.create({
    data: {
      id: 1,
      name: 'Pro',
      price: 9.99,
      billingCycle: 'YEARLY',
    },
  });
}
