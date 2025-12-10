import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import { PrismaClient } from "./generated/prisma-client/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Prisma
// NOTE: Ensure DATABASE_URL is set in your Firebase Functions environment variables
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Blocking function triggered before a new user is created.
 * syncs the user to the database.
 */
export const beforeAuthUserCreated = beforeUserCreated(async (event) => {
    const user = event.data;
    if (!user) return;

    const { uid, email, displayName, photoURL, emailVerified } = user;

    logger.info(`Creating user in DB for ${uid}`);

    try {
        await prisma.user.upsert({
            where: { id: uid },
            update: {
                // If it exists (race condition), update it
                email: email,
                name: displayName || email?.split('@')[0] || 'User',
                avatar: photoURL,
                isVerified: emailVerified,
            },
            create: {
                id: uid,
                email: email!, // Email is expected
                name: displayName || email?.split('@')[0] || 'User',
                avatar: photoURL,
                password: 'firebase-managed', // Dummy value
                isVerified: emailVerified,
                role: 'USER',
            },
        });
        logger.info(`Successfully created/synced user ${uid}`);
    } catch (error) {
        logger.error(`Failed to create user ${uid}:`, error);
        // We don't throw to avoid infinite retries if it's a logic error,
        // but for transient DB errors it might be good to throw.
    }
});

/**
 * Blocking function triggered before a user signs in.
 * Use this to sync user data if it changes in Firebase.
 * NOTE: This requires enabling Blocking Functions in Firebase Console (Identity Platform).
 */
export const beforeAuthUserSignedIn = beforeUserSignedIn(async (event) => {
    const user = event.data;
    if (!user) return;

    const { uid, email, displayName, photoURL, emailVerified } = user;

    try {
        await prisma.user.upsert({
            where: { id: uid },
            update: {
                email: email,
                name: displayName || email?.split('@')[0] || 'User',
                avatar: photoURL,
                isVerified: emailVerified,
            },
            create: {
                id: uid,
                email: email!,
                name: displayName || email?.split('@')[0] || 'User',
                avatar: photoURL,
                password: 'firebase-managed',
                isVerified: emailVerified,
                role: 'USER',
            },
        });
        logger.info(`Synced user ${uid} on sign-in`);
    } catch (error) {
        logger.error(`Failed to sync user ${uid} on sign-in:`, error);
    }
});
