import { User } from "@prisma/client";
import { lucia } from "../app.js";
import { Session } from "lucia";

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: User
    }
}

declare global {
    namespace Express {
        interface Locals {
            user: User | null;
            session: Session | null;
        }
    }
}