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
            const userId = eventData.data.customData.userId;
            const planId = eventData.data.customData.planId;
            const status = eventData.data.status;

            if (eventType === "subscription.created") {
                const startDate = eventData.data.currentBillingPeriod.startsAt;
                const endDate = eventData.data.currentBillingPeriod.endsAt;

                await prisma.subscription.create({
                    data: {
                        userId: userId,
                        planId: planId,
                        startDate: startDate,
                        endDate: endDate,
                        status: status
                    }
                });
            } else if (eventType === "transaction.completed") {
                const subscriptionId = eventData.data.subscriptionId;
                const transactionId = eventData.data.id;
                const items = eventData.data.items;
                const paymentDate = eventData.occurredAt;

                for (const item of items) {
                    console.log(item)
                    const amount = item.price.unitPrice.amount;

                    await prisma.payment.create({
                        data: {
                            subscriptionId: subscriptionId,
                            amount: amount,
                            paymentDate: paymentDate,
                            transactionId: transactionId,
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
        // TODO Delete in production
        return res.status(200).send();

        return res.status(500).send();
    }
});

export default router;