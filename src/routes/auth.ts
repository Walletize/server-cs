import { hash, verify } from '@node-rs/argon2';
import express from 'express';
import { User } from 'lucia';
import { isWithinExpirationDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { lucia, prisma } from '../app.js';
import { sendPasswordResetToken, sendVerificationCode } from '../email/email.js';
import { createPasswordResetToken, generateEmailVerificationCode, verifyVerificationCode } from '../lib/auth.js';
import { seedAccountCategories } from '../prisma/seeders/accountCategories.js';
import { seedUserTransactionCategories } from '../prisma/seeders/transactionCategory.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const user = req.body;
  const name = user.name;
  const email = user.email;
  if (
    typeof email !== 'string' ||
    email.length < 5 || // minimum length for a valid email (e.g., a@b.c)
    email.length > 254 || // maximum length for a valid email
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json('invalid_email');
  }
  const password = user.password;
  if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
    return res.status(400).json('invalid_password');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (existingUser) {
    return res.status(400).json('email_taken');
  }

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: false,
    },
  });

  const verificationCode = await generateEmailVerificationCode(newUser.id, email);
  if (verificationCode) {
    sendVerificationCode(email, name, verificationCode);
  }

  const session = await lucia.createSession(newUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id).serialize();
  res.set('Set-Cookie', sessionCookie);

  return res.status(200).json('signup_successful');
});

router.post('/login', async (req, res) => {
  try {
    const user = req.body;
    const email = user.email;
    if (
      typeof email !== 'string' ||
      email.length < 5 || // minimum length for a valid email (e.g., a@b.c)
      email.length > 254 || // maximum length for a valid email
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json('invalid_email');
    }
    const password = user.password;
    if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
      return res.status(400).json('invalid_password');
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!existingUser) {
      return res.status(400).json('incorrect_credentials');
    }

    const validPassword = await verify(existingUser.passwordHash || '', password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    if (!validPassword) {
      return res.status(400).json('incorrect_credentials');
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();
    res.set('Set-Cookie', sessionCookie);

    return res.status(200).json('login_success');
  } catch {
    return res.status(500).json('internal_error');
  }
});

router.get('/session/validate', async (req, res) => {
  if (res.locals.user) {
    const localUser = res.locals.user as User;
    const user = await prisma.user.findUnique({
      select: {
        email: true,
        name: true,
        image: true,
        mainCurrencyId: true,
        emailVerified: true,
        id: true,
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing'],
            },
          },
          include: {
            plan: true,
          },
        },
      },
      where: {
        id: localUser.id,
      },
    });

    return res.status(200).json(user);
  }

  return res.status(200).json(null);
});

router.get('/logout', async (req, res) => {
  if (!res.locals.session) {
    return res.status(401).end();
  }

  await lucia.invalidateSession(res.locals.session.id);
  const sessionCookie = lucia.createBlankSessionCookie().serialize();
  res.set('Set-Cookie', sessionCookie);

  return res.status(200).json('Log out successful');
});

router.post('/login/:providerId', async (req, res) => {
  const user = req.body;
  const providerId = req.params.providerId;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });
  if (existingUser) {
    const existingOAuthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        providerId,
        providerUserId: user.providerUserId,
      },
    });
    if (!existingOAuthAccount) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          providerId,
          providerUserId: user.providerUserId,
        },
      });
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id).serialize();
    res.set('Set-Cookie', sessionCookie);

    return res.status(200).json('Login successful');
  }

  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: true,
    },
  });
  await prisma.oAuthAccount.create({
    data: {
      userId: newUser.id,
      providerId,
      providerUserId: user.providerUserId,
    },
  });

  await seedAccountCategories(prisma, newUser.id);
  await seedUserTransactionCategories(prisma, newUser.id);

  const session = await lucia.createSession(newUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id).serialize();
  res.set('Set-Cookie', sessionCookie);

  return res.status(200).json('Signup successful');
});

router.post('/email/verify', async (req, res) => {
  const code = req.body.code;
  if (typeof code !== 'string') {
    return res.status(400).json('Verify email failed');
  }

  const user = res.locals.user as User;
  if (!user) {
    return res.status(401).json('Verify email failed');
  }

  const validCode = await verifyVerificationCode(user, code);
  if (!validCode) {
    return res.status(400).json('Verify email failed');
  }

  await lucia.invalidateUserSessions(user.id);
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
    },
  });

  await seedAccountCategories(prisma, user.id);
  await seedUserTransactionCategories(prisma, user.id);

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id).serialize();
  res.set('Set-Cookie', sessionCookie);

  return res.status(200).json('Verify email successful');
});

router.post('/email/resend', async (req, res) => {
  const user = res.locals.user as User;
  if (!user || !user.email) {
    return res.status(400).json('Resend email failed');
  }

  const databaseCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
    },
  });
  if (!databaseCode) {
    return res.status(400).json('Resend email failed');
  }

  if (isWithinExpirationDate(databaseCode.timeoutUntil)) {
    return res.status(400).json('Resend email failed');
  }

  const verificationCode = await generateEmailVerificationCode(user.id, user.email);
  if (verificationCode) {
    sendVerificationCode(user.email, user.name || user.email, verificationCode);
  }

  return res.status(200).json('Resend email successful');
});

router.get('/email/resend', async (req, res) => {
  const user = res.locals.user as User;

  const databaseCode = await prisma.emailVerificationCode.findFirst({
    select: {
      timeoutUntil: true,
    },
    where: {
      userId: user.id,
    },
  });

  return res.status(200).json(databaseCode);
});

router.post('/password/reset', async (req, res) => {
  const body = req.body;
  const email = body.email;
  if (
    typeof email !== 'string' ||
    email.length < 5 || // minimum length for a valid email (e.g., a@b.c)
    email.length > 254 || // maximum length for a valid email
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json('Invalid email');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!existingUser) {
    return res.status(200).json('Reset password email sent');
  }

  const verificationToken = await createPasswordResetToken(existingUser.id);
  const verificationLink = process.env.WEB_URL + '/password/reset/' + verificationToken;
  if (verificationToken) {
    sendPasswordResetToken(email, existingUser.name || 'Walletize User', verificationLink);
  }

  return res.status(200).json('Reset password email sent');
});

router.post('/password/reset/:token', async (req, res) => {
  const verificationToken = req.params.token;
  const body = req.body;
  const password = body.password;
  if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
    return res.status(400).json('Invalid password');
  }

  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
    },
  });
  if (token) {
    await prisma.passwordResetToken.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  if (!token || !isWithinExpirationDate(token.expiresAt)) {
    return res.status(400).json('Password reset failed');
  }

  await lucia.invalidateUserSessions(token.userId);
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  await prisma.user.update({
    where: {
      id: token.userId,
    },
    data: {
      passwordHash,
    },
  });

  const session = await lucia.createSession(token.userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id).serialize();
  res.set('Set-Cookie', sessionCookie);

  return res.status(200).json('Password reset successful');
});

export default router;
