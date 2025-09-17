import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

import { db } from '@/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const evt = await verifyWebhook(req)

        // Do something with payload
        // For this guide, log payload to console
        const { id } = evt.data
        const eventType = evt.type
        console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
        console.log('Webhook payload:', evt.data)

        if (eventType === "user.created") {
            const { data } = evt;
            await db.insert(users).values({
                clerkId: data.id,
                name: `${data.first_name} ${data.last_name}`,
                imageUrl: data.image_url,
            });
        };

        if (eventType === "user.deleted") {
            const { data } = evt;

            if (!data.id) {
                return new Response("Missing user id", { status: 400 })
            };

            await db.delete(users).where(eq(users.clerkId, data.id))
        };

        if (eventType === "user.updated") {
            const { data } = evt;

            await db
                .update(users)
                .set({
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                })
                .where(eq(users.clerkId, data.id))
        };

        return new Response('Webhook received', { status: 200 })
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error verifying webhook', { status: 400 })
    }
}
