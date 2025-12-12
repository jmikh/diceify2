import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DAY_IN_MS = 86_400_000

export const hasPremiumAccess = async (userId: string) => {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
        },
        select: {
            isPro: true,
        },
    })

    // Add any other logic here if you want to support trial periods or temporary access
    return !!user?.isPro
}

export const checkPremium = async () => {
    const session = await auth()

    if (!session?.user?.id) {
        return false
    }

    return await hasPremiumAccess(session.user.id)
}
