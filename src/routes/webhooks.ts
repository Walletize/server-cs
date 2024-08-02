import express from 'express';
import { paddle, prisma } from "../app";

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = (req.headers['paddle-signature'] as string) || '';
        const rawRequestBody = req.body.toString();
        const secretKey = process.env.PADDLE_SECRET_KEY || '';

        if (signature && rawRequestBody) {
            const eventData = paddle.webhooks.unmarshal(rawRequestBody, secretKey, signature) as any;
            if (!eventData) {
                return res.status(403).end();
            };

            const eventType = eventData.eventType;
            const id = eventData.data.id;
            const userId = eventData.data.customData.userId;
            const planId = eventData.data.customData.planId;

            if (eventType === "subscription.created") {
                const startDate = eventData.data.currentBillingPeriod.startsAt;
                const endDate = eventData.data.currentBillingPeriod.endsAt;
                const nextBilledAt = eventData.data.nextBilledAt;
                const status = eventData.data.status;

                await prisma.subscription.create({
                    data: {
                        id: id,
                        userId: userId,
                        planId: planId,
                        startDate: startDate,
                        endDate: endDate,
                        status: status,
                        nextBilledAt: nextBilledAt
                    }
                });
                await prisma.subscriptionHistory.create({
                    data: {
                        subscriptionId: id,
                        startDate: startDate,
                        endDate: endDate,
                        status: status,
                        nextBilledAt: nextBilledAt
                    }
                });
            } else if (eventType === "subscription.updated") {
                const startDate = eventData.data.currentBillingPeriod ? eventData.data.currentBillingPeriod.startsAt : null;
                const endDate = eventData.data.currentBillingPeriod ? eventData.data.currentBillingPeriod.endsAt : null;
                const nextBilledAt = eventData.data.nextBilledAt;
                const status = eventData.data.status;
                
                await prisma.subscription.update({
                    where: {
                        id: eventData.data.id
                    },
                    data: {
                        startDate: startDate,
                        endDate: endDate,
                        status: status,
                        nextBilledAt: nextBilledAt
                    }
                });
                await prisma.subscriptionHistory.create({
                    data: {
                        subscriptionId: id,
                        startDate: startDate,
                        endDate: endDate,
                        status: status,
                        nextBilledAt: nextBilledAt
                    }
                });
            } else if (eventType === "transaction.completed") {
                const subscriptionId = eventData.data.subscriptionId;
                const payments = eventData.data.payments;

                for (const payment of payments) {
                    const amount = payment.amount;
                    const paymentDate = payment.capturedAt;
                    const status = payment.status;
                    const type = payment.methodDetails.type;
                    
                    await prisma.payment.create({
                        data: {
                            transactionId: id,
                            subscriptionId: subscriptionId,
                            status: status,
                            type: type,
                            amount: amount,
                            paymentDate: paymentDate,
                        }
                    });
                };
            };

            return res.status(200).send();
        } else {
            return res.status(403).json({ message: "Signature missing in header" });
        };
    } catch (e) {
        console.error(e);
        return res.status(500).send();
    }
});

export default router;