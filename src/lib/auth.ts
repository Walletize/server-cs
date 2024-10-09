import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';
import { generateRandomString, alphabet, sha256 } from 'oslo/crypto';
import { prisma } from '../app.js';
import { generateIdFromEntropySize, User } from 'lucia';
import { encodeHex } from 'oslo/encoding';

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string | null> {
  const oldCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
    },
  });

  let timeoutSeconds = 60;
  if (oldCode) {
    if (isWithinExpirationDate(oldCode.timeoutUntil)) {
      return null;
    }
    await prisma.emailVerificationCode.deleteMany({
      where: {
        userId,
      },
    });
    const hoursDiff = (new Date().getMilliseconds() - oldCode.createdAt.getMilliseconds()) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      timeoutSeconds = oldCode.timeoutSeconds * 2;
    }
  }

  const code = generateRandomString(6, alphabet('0-9'));
  await prisma.emailVerificationCode.create({
    data: {
      userId,
      email,
      code,
      expiresAt: createDate(new TimeSpan(15, 'm')),
      timeoutUntil: createDate(new TimeSpan(timeoutSeconds, 's')),
      timeoutSeconds,
    },
  });
  return code;
}

export async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
  const databaseCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
    },
  });
  if (!databaseCode || databaseCode.code !== code) {
    return false;
  }
  await prisma.emailVerificationCode.delete({
    where: {
      id: databaseCode.id,
    },
  });

  if (!isWithinExpirationDate(databaseCode.expiresAt)) {
    return false;
  }
  if (databaseCode.email !== user.email) {
    return false;
  }
  return true;
}

export async function createPasswordResetToken(userId: string): Promise<string | null> {
  const oldToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId,
    },
  });

  let timeoutSeconds = 60;
  if (oldToken) {
    if (isWithinExpirationDate(oldToken.timeoutUntil)) {
      return null;
    }
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
      },
    });
    const hoursDiff = (new Date().getMilliseconds() - oldToken.createdAt.getMilliseconds()) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      timeoutSeconds = oldToken.timeoutSeconds * 2;
    }
  }

  const tokenId = generateIdFromEntropySize(25);
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: createDate(new TimeSpan(2, 'h')),
      timeoutUntil: createDate(new TimeSpan(timeoutSeconds, 's')),
      timeoutSeconds,
    },
  });
  return tokenId;
}
