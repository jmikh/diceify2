import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            isPro: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        isPro: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid: string
        isPro: boolean
    }
}
