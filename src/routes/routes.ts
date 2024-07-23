import express from "express";
import auth from "./auth";
import accounts from "./accounts";
import transactions from "./transactions";
import currencies from "./currencies";
import users from "./users";
import webhooks from "./webhooks";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/transactions', transactions);
router.use('/currencies', currencies);
router.use('/users', users);
router.use('/webhooks', express.raw({ type: 'application/json' }), webhooks);

export default router;
