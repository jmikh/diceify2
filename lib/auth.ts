import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        // Pass through the image and name from the token
        if (token.picture) {
          session.user.image = token.picture as string
        }
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
    jwt: async ({ user, token, account, profile }) => {
      if (user) {
        token.uid = user.id
        token.picture = user.image
        token.name = user.name
      }
      // Update token if account/profile changes (like on sign in)
      if (account && profile) {
        token.picture = (profile as any).picture || (profile as any).image || user?.image
        token.name = (profile as any).name || user?.name
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  // pages: {
  //   signIn: "/auth/signin",
  //   error: "/auth/error",
  // },
})