import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === "checkout.session.completed") {
        const userId = session.metadata?.userId

        if (!userId) {
            return new NextResponse("User id is required", { status: 400 })
        }

        try {
            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    isPro: true,
                    proSince: new Date(),
                    stripeCustomerId: session.customer as string,
                },
            })
        } catch (error) {
            console.error("Error updating user subscription:", error)
            return new NextResponse("Internal Database Error", { status: 500 })
        }
    }

    return new NextResponse(null, { status: 200 })
}
