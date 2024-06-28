import express from "express";
import auth from "./auth";
import accounts from "./accounts";
import transactions from "./transactions";
import currencies from "./currencies";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/transactions', transactions);
router.use('/currencies', currencies);

export default router;
