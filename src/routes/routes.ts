import express from "express";
import auth from "./auth";
import accounts from "./accounts";
import accountTypes from "./accountTypes";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/account-types', accountTypes);

export default router;
