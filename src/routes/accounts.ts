import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.post('/signup', async (req, res) => {
    const user = await prisma.financialAccount.create({
        data: {
            id: "aa"
        }
    })


    return res.status(200).json();
}
);

export default router;
