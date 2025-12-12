import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub

        // Always fetch fresh Pro status from DB to ensure accuracy
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { isPro: true }
          })
          session.user.isPro = user?.isPro ?? false
        } catch (e) {
          console.error("Failed to fetch user pro status", e)
          // Fallback to token if DB fails
          session.user.isPro = token.isPro as boolean
        }

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
    jwt: async ({ user, token, account, profile, trigger }) => {
      if (user) {
        token.uid = user.id as string
        token.isPro = user.isPro
        token.picture = user.image
        token.name = user.name
      }

      // Update token if account/profile changes (like on sign in)
      if (account && profile) {
        token.picture = (profile as any).picture || (profile as any).image || user?.image
        token.name = (profile as any).name || user?.name
      }

      // Re-fetch user data from database when session is updated (e.g. after Pro upgrade)
      if (trigger === "update" && token.sub) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { isPro: true }
          })

          if (freshUser) {
            token.isPro = freshUser.isPro
          }
        } catch (error) {
          console.error("Failed to refresh user data in JWT callback:", error)
        }
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