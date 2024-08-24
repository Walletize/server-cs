import React from "react";
import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Tailwind,
    Text
} from "@react-email/components";

interface EmailVerificationTemplateProps {
    name: string;
    verificationCode?: string;
    teamName?: string;
    teamImage?: string;
    inviteLink?: string;
    inviteFromIp?: string;
    inviteFromLocation?: string;
}

export const EmailVerificationTemplate = ({
    name,
    verificationCode,
}: EmailVerificationTemplateProps) => {
    const previewText = "Confirm your Walletize account";

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`https://www.walletize.app/walletize.svg`}
                                width="60"
                                height="60"
                                alt="Walletize"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                            Confirm your email address
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {name},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Your confirmation code is below - enter it in your open browser window and we&apos;ll help you get signed in.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px] text-[24px]">
                            <code style={code}>{verificationCode}</code>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            If you didn&apos;t request this email, there&apos;s nothing to worry about, you can safely ignore it.
                        </Text>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            <Link href="https://www.walletize.app" style={link}>
                                Walletize
                            </Link>
                            : Simplify Your Money
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default EmailVerificationTemplate;

const code = {
    display: "inline-block",
    padding: "16px 4.5%",
    width: "90.5%",
    backgroundColor: "#f4f4f4",
    borderRadius: "5px",
    border: "1px solid #eee",
    color: "#333",
};

const link = {
    color: "#666666",
    fontSize: "12px",
    textDecoration: "underline",
};