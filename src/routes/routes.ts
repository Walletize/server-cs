import express from "express";
import auth from "./auth.js";
import accounts from "./accounts.js";
import transactions from "./transactions.js";
import currencies from "./currencies.js";
import users from "./users.js";
import subscriptions from "./subscriptions.js";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/transactions', transactions);
router.use('/currencies', currencies);
router.use('/users', users);
router.use('/subscriptions', subscriptions);

export default router;
