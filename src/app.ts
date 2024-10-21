import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { Paddle } from '@paddle/paddle-node-sdk';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { Lucia } from 'lucia';
import cron from 'node-cron';
import { verifyOrigin, verifySession } from './lib/midddleware.js';
import { updateCurrencyRates } from './lib/utils.js';
import routes from './routes/routes.js';
import webhooks from './routes/webhooks.js';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

export const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma.session, prisma.user);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      image: attributes.image,
      mainCurrencyId: attributes.mainCurrencyId,
      emailVerified: attributes.emailVerified,
    };
  },
});
export const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const app = express();
app.use(verifyOrigin);
app.use(verifySession);
app.use('/webhooks', express.raw({ type: 'application/json' }), webhooks);
app.use(express.json());
app.use('/', routes);

app.listen(process.env.PORT || 3100, () => {
  console.info('Server started at ' + (process.env.PORT || 3100));
  console.info('Environment: ' + env);
});

// updateCurrencyRates();

cron.schedule('0 0 * * *', () => {
  updateCurrencyRates();
});
