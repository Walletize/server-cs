import express from "express";
import auth from "./auth";
import accounts from "./accounts";

const router = express.Router()

router.use('/auth', auth);
router.use('/accounts', accounts);

export default router;
