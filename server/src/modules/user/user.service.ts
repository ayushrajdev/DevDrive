import type { IUser, UserRole } from '../../shared/types/index.js';
import type { IUserRepository } from './user.repository.js';
import type { ISessionService } from '../session/session.service.js';
import { hashPassword, verifyPassword } from '../../shared/utils/argon.js';
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from '../../shared/errors/AppError.js';

export interface RegisterWithEmailParams {
    name?: string;
    email: string;
    password: string;
}

export interface LoginWithEmailParams {
    email: string;
    password: string;
}

export interface LoginWithOAuthParams {
    email: string;
    name: string;
    picture: string;
    authProvider: 'google' | 'github';
}

export interface AuthResult {
    user: Omit<IUser, 'password'>;
    sessionId: string;
}

export interface IUserService {
    registerWithEmail(params: RegisterWithEmailParams): Promise<AuthResult>;
    loginWithEmail(params: LoginWithEmailParams): Promise<AuthResult>;
    loginWithOAuth(params: LoginWithOAuthParams): Promise<AuthResult>;
    getUserById(id: string): Promise<IUser>;
    getAllUsers(): Promise<IUser[]>;
    getActiveUsers(): Promise<IUser[]>;
    getDisabledUsers(): Promise<IUser[]>;
    softDeleteUser(operator: IUser, targetUserId: string): Promise<IUser | null>;
    hardDeleteUser(operator: IUser, targetUserId: string): Promise<IUser | null>;
    recoverUser(operator: IUser, targetUserId: string): Promise<IUser | null>;
    updateRole(operator: IUser, targetUserId: string, newRole: UserRole): Promise<IUser | null>;
    setPassword(userId: string, newPassword: string): Promise<void>;
    logout(sessionId: string): Promise<void>;
    logoutAllDevices(userId: string): Promise<void>;
}

export class UserService implements IUserService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionService: ISessionService,
    ) {}

    async registerWithEmail({ name, email, password }: RegisterWithEmailParams): Promise<AuthResult> {
        const existing = await this.userRepository.findUserByEmail(email);
        if (existing) throw new ConflictError('An account with this email already exists');

        const hashedPassword = await hashPassword(password);
        const user = await this.userRepository.createUser({
            name,
            email,
            password: hashedPassword,
            authProvider: 'email',
        });

        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _pw, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }

    async loginWithEmail({ email, password }: LoginWithEmailParams): Promise<AuthResult> {
        const user = await this.userRepository.findUserByEmail(email);
        if (!user || !user.password) {
            throw new UnauthorizedError('Invalid email or password');
        }
        if (user.deleted) {
            throw new ForbiddenError('Your account has been disabled. Please contact support.');
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) throw new UnauthorizedError('Invalid email or password');

        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _pw, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }

    async loginWithOAuth({ email, name, picture, authProvider }: LoginWithOAuthParams): Promise<AuthResult> {
        const user = await this.userRepository.upsertOAuthUser({ email, name, picture, authProvider });
        if (user.deleted) {
            throw new ForbiddenError('Your account has been disabled. Please contact support.');
        }
        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _pw, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }

    async getUserById(id: string): Promise<IUser> {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    getAllUsers(): Promise<IUser[]> {
        return this.userRepository.getAllUsers();
    }

    getActiveUsers(): Promise<IUser[]> {
        return this.userRepository.getActiveUsers();
    }

    getDisabledUsers(): Promise<IUser[]> {
        return this.userRepository.getDisabledUsers();
    }

    async softDeleteUser(operator: IUser, targetUserId: string): Promise<IUser | null> {
        const target = await this.getUserById(targetUserId);

        // Cannot delete owner
        if (target.role === 'owner') {
            throw new ForbiddenError('Cannot delete the owner account');
        }

        // Admin cannot delete another admin
        if (operator.role === 'admin' && target.role === 'admin') {
            throw new ForbiddenError('Administrators cannot delete other administrators');
        }

        return this.userRepository.softDeleteUser(targetUserId);
    }

    async hardDeleteUser(operator: IUser, targetUserId: string): Promise<IUser | null> {
        const target = await this.getUserById(targetUserId);

        if (target.role === 'owner') {
            throw new ForbiddenError('Cannot delete the owner account');
        }

        if (operator.role !== 'owner') {
            throw new ForbiddenError('Only the owner role can permanently hard-delete user accounts');
        }

        return this.userRepository.hardDeleteUser(targetUserId);
    }

    async recoverUser(operator: IUser, targetUserId: string): Promise<IUser | null> {
        await this.getUserById(targetUserId);

        if (operator.role !== 'owner' && operator.role !== 'admin') {
            throw new ForbiddenError('Only owner or administrator can recover deactivated accounts');
        }

        return this.userRepository.recoverUser(targetUserId);
    }

    async updateRole(operator: IUser, targetUserId: string, newRole: UserRole): Promise<IUser | null> {
        const validRoles: UserRole[] = ['user', 'admin', 'manager', 'owner'];
        if (!validRoles.includes(newRole)) {
            throw new BadRequestError(`Invalid target role: ${newRole}`);
        }

        // Prevent modifying one's own role
        if (String(operator._id) === String(targetUserId)) {
            throw new BadRequestError('You cannot change your own role');
        }

        const target = await this.getUserById(targetUserId);

        // Only owner can assign or demote the owner role
        if (newRole === 'owner' && operator.role !== 'owner') {
            throw new ForbiddenError('Only an owner can grant the owner role');
        }
        if (target.role === 'owner' && operator.role !== 'owner') {
            throw new ForbiddenError('Only an owner can modify an existing owner account');
        }

        // Manager restrictions: cannot assign admin or owner
        if (operator.role === 'manager' && (newRole === 'admin' || newRole === 'owner')) {
            throw new ForbiddenError('Managers can only assign user or manager roles');
        }

        return this.userRepository.updateRole(targetUserId, newRole);
    }

    async setPassword(userId: string, newPassword: string): Promise<void> {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters long');
        }

        const user = await this.getUserById(userId);
        const hashedPassword = await hashPassword(newPassword);
        await this.userRepository.setPassword(String(user._id), hashedPassword);
    }

    async logout(sessionId: string): Promise<void> {
        await this.sessionService.deleteSession(sessionId);
    }

    async logoutAllDevices(userId: string): Promise<void> {
        await this.sessionService.deleteAllUserSessions(userId);
    }
}
