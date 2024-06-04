import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.post('/signup', async (req, res) => {
    // TODO: check if username is already used
    const user = await prisma.user.create({
        data: {
            id: "aa"
        }
    })

    // const session = await lucia.createSession(userId, {});
    
    return res.status(200).json();
}
);

export default router;
