import express from 'express';
import { PrismaClient } from "@prisma/client"
import routes from './routes/routes';
import cron from 'node-cron';
import { updateCurrencyRates } from './lib/utils';

export const prisma = new PrismaClient()

const app = express();

app.use(express.json())

app.use('/api', routes);

app.listen(process.env.PORT, () => {
    console.log('Server started at ' + process.env.PORT)
});

// updateCurrencyRates();

cron.schedule('0 0 * * *', () => {
    updateCurrencyRates();
});
