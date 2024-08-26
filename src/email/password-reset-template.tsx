import React from "react";
import {
    Body,
    Button,
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

interface PasswordResetTemplateProps {
    name: string;
    resetPasswordLink: string;
}

export const PasswordResetTemplate = ({
    name,
    resetPasswordLink,
}: PasswordResetTemplateProps) => {
    const previewText = "Reset your Walletize password";

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
                            Reset your password
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {name},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Someone recently requested a password change for your Walletize account. If this was you, you can set a new password here:
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px] text-[24px]">
                            <Button style={button} href={resetPasswordLink} className="mx-auto">
                                Reset password
                            </Button>
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

export default PasswordResetTemplate;

const button = {
    backgroundColor: "#45ba7e",
    borderRadius: "6px",
    color: "#fff",
    fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
    fontSize: "13px",
    fontWeight: "500",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "394px",
    padding: "14px 14px",
};

const link = {
    color: "#666666",
    fontSize: "12px",
    textDecoration: "underline",
};