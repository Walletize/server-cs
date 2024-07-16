import express from 'express';
import { PrismaClient } from "@prisma/client"
import routes from './routes/routes';
import cron from 'node-cron';
import { updateCurrencyRates } from './lib/utils';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { Lucia } from 'lucia';

export const prisma = new PrismaClient()

const adapter = new PrismaAdapter(prisma.session, prisma.user);
export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === "production"
        }
    }
});
declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
    }
}

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
