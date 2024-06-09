import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const accountTypes = await prisma.accountType.findMany({
            include: {
                accountCategories: true,
            }
        })
        
        return res.status(200).json(accountTypes);
    } catch (e) {
        console.error(e);
    }
}
);

export default router;
