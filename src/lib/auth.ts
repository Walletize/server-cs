import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/crypto";
import { prisma } from "../app";
import { User } from "@prisma/client";

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
    await prisma.emailVerificationCode.deleteMany({
        where: {
            userId: userId
        }
    });
    const code = generateRandomString(8, alphabet("0-9"));
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
