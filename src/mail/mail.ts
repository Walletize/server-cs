import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import { render } from "@react-email/components";
import { Email } from "./mail-component";

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
const emailHtml = render(Email());

export function sendVerificationCode(email: string, verificationCode: string) {
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