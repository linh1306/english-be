import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { FirebaseUser } from '../../core/firebase/decorators/current-user.decorator';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) { }

    async register(firebaseUser: FirebaseUser) {
        if (!firebaseUser.email) {
            throw new BadRequestException('User email is required from Firebase token');
        }

        // Check if user exists
        const existingUser = await this.userService.findByEmail(firebaseUser.email);
        if (existingUser) {
            return existingUser;
        }

        // Create new user
        // Password is required by schema but we use Firebase Auth, so we generate a random one
        // and force isVerified from firebase token
        const newUserDto: CreateUserDto = {
            email: firebaseUser.email,
            name: firebaseUser.name || firebaseUser.email.split('@')[0],
            avatar: firebaseUser.picture,
            password: randomUUID(), // Dummy password
            role: 'USER',
            isVerified: firebaseUser.email_verified,
        };

        return this.userService.create(newUserDto);
    }
}
