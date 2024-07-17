import express from 'express';
import { PrismaClient } from "@prisma/client"
import routes from './routes/routes';
import cron from 'node-cron';
import { updateCurrencyRates } from './lib/utils';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { Lucia, Session, verifyRequestOrigin } from 'lucia';

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

app.use((req, res, next) => {
    if (req.method === "GET") {
        return next();
    }
    const originHeader = req.headers.origin ?? null;
    const hostHeader = req.headers.host ?? null;
    if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
        return res.status(403).end();
    }
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

declare global {
    namespace Express {
        interface Locals {
            user: User | null;
            session: Session | null;
        }
    }
}


app.use('/api', routes);

app.listen(process.env.PORT, () => {
    console.log('Server started at ' + process.env.PORT)
});

// updateCurrencyRates();

cron.schedule('0 0 * * *', () => {
    updateCurrencyRates();
});
