import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
    try {
        const session = await auth()

        if (!session?.user || !session?.user.email) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        if (!appUrl) {
            throw new Error("Missing NEXT_PUBLIC_APP_URL")
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_creation: "always",
            payment_method_types: ["card"],
            customer_email: session.user.email as string,
            metadata: {
                userId: session.user.id,
            },
            line_items: [
                {
                    price: "price_1SdKx6Lo6uxDWPxNVXbUgiXm",
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/?success=true`,
            cancel_url: `${appUrl}/?canceled=true`,
        })


        return NextResponse.json({ url: checkoutSession.url })
    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT_ERROR]", error)
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Missing STRIPE_SECRET_KEY environment variable")
        }
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
