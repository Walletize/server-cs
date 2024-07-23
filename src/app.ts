import express from 'express';
import { PrismaClient, User } from "@prisma/client"
import routes from './routes/routes';
import cron from 'node-cron';
import { updateCurrencyRates } from './lib/utils';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { Lucia, Session, verifyRequestOrigin } from 'lucia';
import { Paddle } from '@paddle/paddle-node-sdk';

export const prisma = new PrismaClient()
const adapter = new PrismaAdapter(prisma.session, prisma.user);
export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: process.env.NODE_ENV === "production"
        }
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            name: attributes.name,
            image: attributes.image,
            mainCurrencyId: attributes.mainCurrencyId,
            emailVerified: attributes.emailVerified,
        };
    }

});
export const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const app = express();

app.use((req, res, next) => {
    if (req.method === "GET" || req.path.startsWith('/api/webhooks')) {
        return next();
    };
    
    const originHeader = "http://" + req.headers.origin ?? null;
    const allowedOrigin = "http://localhost:3101";
    if (!originHeader || !allowedOrigin || !verifyRequestOrigin(originHeader, [allowedOrigin])) {
        return res.status(403).end();
    };

    return next();
});


app.use(async (req, res, next) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
    if (!sessionId) {
        res.locals.user = null;
        res.locals.session = null;
        return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    }
    if (!session) {
        res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }
    res.locals.user = user;
    res.locals.session = session;
    return next();
});

app.use('/api', routes);
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log('Server started at ' + process.env.PORT)
});

// updateCurrencyRates();

cron.schedule('0 0 * * *', () => {
    updateCurrencyRates();
});
