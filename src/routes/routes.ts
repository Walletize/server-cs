import express from 'express';
import auth from './auth.js';
import accounts from './accounts.js';
import transactions from './transactions.js';
import currencies from './currencies.js';
import users from './users.js';
import subscriptions from './subscriptions.js';
import { isAuthenticated } from '../lib/midddleware.js';

const router = express.Router();

router.use('/auth', auth);
router.use('/accounts', isAuthenticated, accounts);
router.use('/transactions', isAuthenticated, transactions);
router.use('/currencies', isAuthenticated, currencies);
router.use('/users', isAuthenticated, users);
router.use('/subscriptions', isAuthenticated, subscriptions);

export default router;
