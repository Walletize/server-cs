import express from "express";
import auth from "./auth";
import accounts from "./accounts";
import transactions from "./transactions";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/transactions', transactions);

export default router;
