import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import { generateRandomString, alphabet, sha256 } from "oslo/crypto";
import { prisma } from "../app";
import { User } from "@prisma/client";
import { generateIdFromEntropySize } from "lucia";
import { encodeHex } from "oslo/encoding";

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
    await prisma.emailVerificationCode.deleteMany({
        where: {
            userId: userId
        }
    });
    const code = generateRandomString(6, alphabet("0-9"));
    await prisma.emailVerificationCode.create({
        data: {
            userId: userId,
            email: email,
            code: code,
            expiresAt: createDate(new TimeSpan(15, "m")),
            allowResendAt: createDate(new TimeSpan(1, "m"))
        }
    });
    return code;
}

export async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
    const databaseCode = await prisma.emailVerificationCode.findFirst({
        where: {
            userId: user.id,
        }
    });
    if (!databaseCode || databaseCode.code !== code) {
        return false;
    }
    await prisma.emailVerificationCode.delete({
        where: {
            id: databaseCode.id
        }
    });

    if (!isWithinExpirationDate(databaseCode.expiresAt)) {
        return false;
    }
    if (databaseCode.email !== user.email) {
        return false;
    }
    return true;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
    await prisma.passwordResetToken.deleteMany({
        where: {
            userId: userId
        }
    });
    const tokenId = generateIdFromEntropySize(25);
    const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
    await prisma.passwordResetToken.create({
        data: {
            userId: userId,
            tokenHash: tokenHash,
            expiresAt: createDate(new TimeSpan(2, "h"))
        }
    });
    return tokenId;
};
