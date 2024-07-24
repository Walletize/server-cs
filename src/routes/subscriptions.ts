import express from 'express';

const router = express.Router();

router.post('/cancel/:subscriptionId', async (req, res) => {
    try {
        const subscriptionId = req.params.subscriptionId;
        if (!subscriptionId) {
            return res.status(500).json({ message: "Subscription id not found" });
        };

        const cancel = await fetch(`https://sandbox-api.paddle.com/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.PADDLE_API_KEY!,
            },
            body: JSON.stringify({
                effective_from: "next_billing_period"
            })
        });
        const body = await cancel.json()
        console.log(body)

        if (cancel.ok) {
            return res.status(200).json({ message: "Cancel subscription succesful" });
        } else {
            return res.status(500).json({ message: "Cancel subscription failed" });
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Cancel subscription failed" });
    }
});

export default router;
