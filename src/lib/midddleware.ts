import { Request, Response, NextFunction } from 'express';
import { verifyRequestOrigin } from 'lucia';
import { lucia } from '../app';

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.path.startsWith('/webhooks')) {
    return next();
  };
  const originHeader = req.headers.origin;
  const allowedOrigin = process.env.WEB_URL;
  if (!originHeader || !allowedOrigin || !verifyRequestOrigin(originHeader, [allowedOrigin])) {
    return res.status(403).json({ message: "Forbidden" });
  };

  return next();
}

export async function verifySession(req: Request, res: Response, next: NextFunction) {
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
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (res.locals.user && res.locals.session) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}