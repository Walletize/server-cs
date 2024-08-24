import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import { render } from "@react-email/components";
import PasswordResetTemplate from "./password-reset-template.js";
import { EmailVerificationTemplate } from "./email-verification-template.js";

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

export function sendVerificationCode(email: string, name: string, verificationCode: string) {
    const emailHtml = render(EmailVerificationTemplate({ name: name, verificationCode: verificationCode }));

    transporter.sendMail(
        {
            from: {
                name: 'Walletize',
                address: 'noreply@walletize.app'
            },
            to: email,
            subject: "Confirm your Walletize account",
            html: emailHtml,
        },
 
        (error) => {
            if (error) {
                console.error('Error sending email:', error);
            }
        }
    );
};

export function sendPasswordResetToken(email: string, name: string, resetPasswordLink: string) {
    const emailHtml = render(PasswordResetTemplate({ name: name, resetPasswordLink: resetPasswordLink }));

    transporter.sendMail(
        {
            from: {
                name: 'Walletize',
                address: 'noreply@walletize.app'
            },
            to: email,
            subject: "Reset your Walletize password",
            html: emailHtml,
        },

        (error) => {
            if (error) {
                console.error('Error sending email:', error);
            }
        }
    );
};
