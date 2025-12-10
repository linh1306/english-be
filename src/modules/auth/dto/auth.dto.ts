import { UserResponse } from '../../user/dto/user.dto';

export class LoginDto {
    idToken!: string;
}

export interface AuthResponse {
    user: UserResponse;
    accessToken?: string; // If we issue our own token, otherwise just return user
}
