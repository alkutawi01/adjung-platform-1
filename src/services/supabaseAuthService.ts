import { supabase } from '../config/supabase';
import { User, UserRole, RolePermissions, SystemSettings } from '../types';

// ==========================================
// 1. User Repository
// ==========================================
export class UserRepository {
  static async getUserByUsernameOrEmail(identifier: string): Promise<User | undefined> {
    const normalized = identifier.trim().toLowerCase();

    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (!data && !error) {
      const byUsername = await supabase
        .from('users')
        .select('*')
        .eq('username', normalized)
        .maybeSingle();
      data = byUsername.data;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      penName: data.pen_name,
      signature: data.signature,
      avatarColor: data.avatar_color || '',
      bioSummary: data.bio_summary || '',
      suspended: !!data.suspended,
      affiliation: data.affiliation || '',
    };
  }
}

// ==========================================
// 2. RBAC Service
// ==========================================
export class RbacService {
  static hasPermission(user: User | null, permissionKey: keyof RolePermissions, systemSettings: SystemSettings): boolean {
    const role: UserRole = user ? user.role : 'Visitor';
    const permissions = systemSettings.rolePermissions?.[role];
    if (!permissions) return false;
    return permissions[permissionKey] ?? false;
  }
}

// ==========================================
// 3. Session Service
// ==========================================
export class SessionService {
  private static SESSION_KEY = 'Adjung_session_user_id';

  static createSession(user: User, rememberMe: boolean = true): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.SESSION_KEY, user.id);
    storage.setItem('Adjung_session_user_data', JSON.stringify(user));
  }

  static destroySession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('Adjung_session_user_data');
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('Adjung_session_user_data');
  }

  static validateAndRetrieveSession(): User | null {
    const cachedUserStr = localStorage.getItem('Adjung_session_user_data') || sessionStorage.getItem('Adjung_session_user_data');
    if (cachedUserStr) {
      try {
        const cachedUser = JSON.parse(cachedUserStr);
        if (cachedUser.suspended) {
          this.destroySession();
          return null;
        }
        return cachedUser;
      } catch (e) {
        this.destroySession();
        return null;
      }
    }
    return null;
  }
}

// ==========================================
// 4. Authentication Service
// ==========================================
export type AuthErrorType = 'UserNotFound' | 'IncorrectPassword' | 'AccountSuspended' | 'AuthFailed';

export class AuthError extends Error {
  constructor(public type: AuthErrorType, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  static async signIn(usernameOrEmailInput: string, passwordInput: string, rememberMe: boolean = true): Promise<User> {
    const userDoc = await UserRepository.getUserByUsernameOrEmail(usernameOrEmailInput);
    if (!userDoc) {
      throw new AuthError('UserNotFound', 'Username or email not registered on Adjung.');
    }

    if (userDoc.suspended) {
      throw new AuthError('AccountSuspended', 'This account has been suspended by the Editorial Board.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: userDoc.email,
      password: passwordInput,
    });

    if (error) {
      throw new AuthError('IncorrectPassword', 'The password entered is incorrect.');
    }

    SessionService.createSession(userDoc, rememberMe);
    return userDoc;
  }

  static async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      throw new AuthError('AuthFailed', error.message || 'Google authentication failed.');
    }
    // Redirect flow: session resolution happens via onAuthStateChange after redirect.
  }

  static async signInWithPreset(username: string): Promise<User> {
    return this.signIn(username, 'password', true);
  }

  static async resetPassword(email: string): Promise<void> {
    const userDoc = await UserRepository.getUserByUsernameOrEmail(email);
    if (!userDoc) {
      throw new Error('No account found with this email.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  static signOut(): void {
    supabase.auth.signOut().catch(err => console.error('Supabase signout failed:', err));
    SessionService.destroySession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('Adjung_acting_user_id');
    }
  }
}
