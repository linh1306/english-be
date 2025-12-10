import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { UserService } from '../user/user.service';
import { LoginDto, AuthResponse } from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly userService: UserService,
    ) { }

    async login(dto: LoginDto): Promise<AuthResponse> {
        // 1. Verify token with Firebase
        let decodedToken;
        try {
            decodedToken = await this.firebaseService.verifyIdToken(dto.idToken);
        } catch (error) {
            throw new UnauthorizedException('Invalid Firebase ID token');
        }

        const { uid, email, picture, name } = decodedToken;

        if (!email) {
            throw new UnauthorizedException('Email is required in Firebase token');
        }

        // 2. Check if user exists in DB
        let user = await this.userService.findByEmail(email);

        if (!user) {
            // 3. Create new user if not exists
            // Since we use Firebase, we set a random password
            const randomPassword = crypto.randomBytes(16).toString('hex');

            // We map generic UserResponse to Internal User to separate concerns? 
            // UserService returns UserResponse, but here we need to create... 
            // UserService.create takes CreateUserDto

            const newUser = await this.userService.create({
                email,
                name: name || email.split('@')[0],
                avatar: picture,
                password: randomPassword,
            });

            // UserService.create returns UserResponse which is compatible
            return {
                user: newUser,
                accessToken: dto.idToken, // Return the token back or issue a new one
            };
        }

        // If user exists, we might want to update avatar or name if changed? 
        // For now, just return found user.
        // We need to cast or fetch properly. UserService.findByEmail returns Prisma User.
        // We need to convert it to UserResponse.

        // I need to be careful about types here.
        // UserService.findByEmail returns Prisma object.
        // I should stick to using UserService public methods if possible, 
        // but finding by email returns raw object in my implementation.
        // Let's manually map it or update UserService to return DTO.

        // For this task, I'll just map it here or cast it.
        // UserService has mapToResponse but it is private.
        // I should probably expose mapToResponse or duplicate logic.
        // Or update UserService to return UserResponse from findByEmail.

        // Let's just manually map for now to save time, or use `findOne` if I have ID.
        // I have user, so I have user.id.
        const userResponse = await this.userService.findOne(user.id);

        return {
            user: userResponse,
            accessToken: dto.idToken,
        };
    }
}
