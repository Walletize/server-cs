import express from 'express';
import { prisma } from "../app";

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // await prisma.financialAccount.create({
        //     data: {
        //         userId: "aaa",
        //         subtypeId: "",
        //         initialBalance: 0,
        //         currentBalance: 0
        //     }
        // });
        console.log(req.body);

        return res.status(200).json();
    } catch (e) {
        console.error(e);
    }
}
);

export default router;
