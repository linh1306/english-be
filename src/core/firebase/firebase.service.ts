import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private firebaseApp: admin.app.App;

    onModuleInit() {
        if (admin.apps.length === 0) {
            // Option 1: Using service account file path (recommended for development)
            // Make sure to add GOOGLE_APPLICATION_CREDENTIALS to your .env file
            // pointing to your Firebase service account JSON file path

            // Option 2: Using environment variables (recommended for production)
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : undefined;

            this.firebaseApp = admin.initializeApp({
                credential: serviceAccount
                    ? admin.credential.cert(serviceAccount)
                    : admin.credential.applicationDefault()
            });
        } else {
            this.firebaseApp = admin.app();
        }
    }

    /**
     * Get Firebase Auth instance
     */
    getAuth(): admin.auth.Auth {
        return this.firebaseApp.auth();
    }

    /**
     * Verify Firebase ID token
     * @param idToken - The Firebase ID token to verify
     * @returns Decoded token containing user information
     */
    async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        return this.firebaseApp.auth().verifyIdToken(idToken);
    }

    /**
     * Get user by UID
     * @param uid - Firebase user UID
     */
    async getUser(uid: string): Promise<admin.auth.UserRecord> {
        return this.firebaseApp.auth().getUser(uid);
    }

    /**
     * Get user by email
     * @param email - User email
     */
    async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
        return this.firebaseApp.auth().getUserByEmail(email);
    }

    /**
     * Create a new user
     * @param properties - User properties
     */
    async createUser(
        properties: admin.auth.CreateRequest,
    ): Promise<admin.auth.UserRecord> {
        return this.firebaseApp.auth().createUser(properties);
    }

    /**
     * Update user by UID
     * @param uid - Firebase user UID
     * @param properties - Properties to update
     */
    async updateUser(
        uid: string,
        properties: admin.auth.UpdateRequest,
    ): Promise<admin.auth.UserRecord> {
        return this.firebaseApp.auth().updateUser(uid, properties);
    }

    /**
     * Delete user by UID
     * @param uid - Firebase user UID
     */
    async deleteUser(uid: string): Promise<void> {
        return this.firebaseApp.auth().deleteUser(uid);
    }

    /**
     * Set custom claims for a user
     * @param uid - Firebase user UID
     * @param claims - Custom claims object
     */
    async setCustomClaims(
        uid: string,
        claims: Record<string, unknown>,
    ): Promise<void> {
        return this.firebaseApp.auth().setCustomUserClaims(uid, claims);
    }

    /**
     * Create a custom token for a user
     * @param uid - Firebase user UID
     * @param developerClaims - Optional additional claims
     */
    async createCustomToken(
        uid: string,
        developerClaims?: Record<string, unknown>,
    ): Promise<string> {
        return this.firebaseApp.auth().createCustomToken(uid, developerClaims);
    }

    /**
     * Revoke all refresh tokens for a user
     * @param uid - Firebase user UID
     */
    async revokeRefreshTokens(uid: string): Promise<void> {
        return this.firebaseApp.auth().revokeRefreshTokens(uid);
    }
}
