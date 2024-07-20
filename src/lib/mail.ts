import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";

const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY!,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
    },
});

const transporter = nodemailer.createTransport({
    SES: { ses, aws },
});

export function sendVerificationCode(email: string, verificationCode: string) {
    transporter.sendMail(
        {
            from: "noreply@walletize.app",
            to: email,
            subject: "Testing my Nodemailer/SES setup",
            text: verificationCode,
        },
        // callback
        (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.messageId);
            }
        }
    );
};