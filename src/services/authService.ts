import { db } from '../db/mockDb';
import { User, UserRole, RolePermissions, SystemSettings } from '../types';

// ==========================================
// 1. User Repository (Unified Lookup Engine)
// ==========================================
export class UserRepository {
  /**
   * Retrieves all users currently in the database.
   */
  static getAllUsers(): User[] {
    return db.getUsers();
  }

  /**
   * Resolves a user by their unique database ID.
   */
  static getUserById(id: string): User | undefined {
    return db.getUserById(id);
  }

  /**
   * Resolves a user by their username or email (case-insensitive, normalized).
   */
  static getUserByUsernameOrEmail(identifier: string): User | undefined {
    const normalized = identifier.trim().toLowerCase();
    return db.getUsers().find(u => 
      u.username.toLowerCase() === normalized || 
      u.email.toLowerCase() === normalized
    );
  }

  /**
   * Updates a user record in the database.
   */
  static updateUser(user: User): void {
    db.updateUser(user);
  }
}

// ==========================================
// 2. RBAC Service (Role-Based Access Control)
// ==========================================
export class RbacService {
  /**
   * Checks if a user has a specific permission based on their role and current system settings.
   */
  static hasPermission(user: User | null, permissionKey: keyof RolePermissions, systemSettings: SystemSettings): boolean {
    const role: UserRole = user ? user.role : 'Visitor';
    const permissions = systemSettings.rolePermissions?.[role];
    if (!permissions) return false;
    return permissions[permissionKey] ?? false;
  }
}

// ==========================================
// 3. Session Service (State Preservation & Audit)
// ==========================================
export class SessionService {
  private static SESSION_KEY = 'adjung_session_user_id';

  /**
   * Starts a persistent session by storing the user ID.
   */
  static createSession(userId: string): void {
    localStorage.setItem(this.SESSION_KEY, userId);
  }

  /**
   * Ends the persistent session.
   */
  static destroySession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Retrieves and automatically audits the current session.
   * If the session is stale, refers to a deleted user, or refers to a suspended user,
   * it discards the session safely.
   * If the user's role, username, or other metadata changed, it returns the fresh user record.
   */
  static validateAndRetrieveSession(): User | null {
    const userId = localStorage.getItem(this.SESSION_KEY);
    if (!userId) return null;

    const freshUser = UserRepository.getUserById(userId);
    if (!freshUser) {
      console.warn('Stale session detected: User no longer exists. Discarding session.');
      this.destroySession();
      return null;
    }

    if (freshUser.suspended) {
      console.warn('Session audit: User account is suspended. Terminating session.');
      this.destroySession();
      return null;
    }

    return freshUser;
  }
}

// ==========================================
// 4. Authentication Service (Pipeline Implementation)
// ==========================================
export type AuthErrorType = 'UserNotFound' | 'IncorrectPassword' | 'AccountSuspended';

export class AuthError extends Error {
  constructor(public type: AuthErrorType, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  /**
   * Standard sign-in pipeline.
   * Pipeline: Normalize Input -> Resolve User -> Verify Password -> Check Account Status -> Create Session
   */
  static signIn(usernameOrEmailInput: string, passwordInput: string): User {
    // 1. Normalize Input
    const normalizedIdentifier = usernameOrEmailInput.trim().toLowerCase();
    
    // 2. Resolve User
    const user = UserRepository.getUserByUsernameOrEmail(normalizedIdentifier);
    if (!user) {
      throw new AuthError('UserNotFound', 'User not found. (Please check your username or email)');
    }

    // 3. Verify Password (checks localStorage for custom user password, falling back to 'password')
    const userPassword = localStorage.getItem(`adjung_password_${user.id}`) || 'password';
    if (passwordInput !== userPassword) {
      throw new AuthError('IncorrectPassword', `Incorrect password. (Note: use the active password for this user; default is "password")`);
    }

    // 4. Check Account Status
    if (user.suspended) {
      throw new AuthError('AccountSuspended', 'This account has been suspended by the editorial board.');
    }

    // 5. Create Session
    SessionService.createSession(user.id);

    return user;
  }

  /**
   * Sign-in via Fast-Login Preset.
   * Uses the identical authentication pipeline but bypasses manual password entry (simulates automatic 'password' verification).
   */
  static signInWithPreset(username: string): User {
    // Uses the identical pipeline for robustness, but provides the preset password automatically.
    return this.signIn(username, 'password');
  }

  /**
   * Sign-out helper.
   */
  static signOut(): void {
    SessionService.destroySession();
  }
}
