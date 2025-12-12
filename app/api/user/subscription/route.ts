import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                isPro: true,
            },
        })

        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        return NextResponse.json({ isPro: user.isPro })
    } catch (error) {
        console.error("[USER_SUBSCRIPTION_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
