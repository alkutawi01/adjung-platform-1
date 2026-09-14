import { supabase } from '../config/supabase';
import { User, UserRole, RolePermissions, SystemSettings } from '../types';
import { clearAllSupabaseCookies } from '../utils/cookieStorage';

// ==========================================
// 1. User Repository
// ==========================================
export class UserRepository {
  // Only callable after sign-in: email is not readable by anonymous visitors.
  static async getUserByAuthId(authUserId: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

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
  static async signIn(emailInput: string, passwordInput: string, rememberMe: boolean = true): Promise<User> {
    const email = emailInput.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new AuthError('UserNotFound', 'Please sign in with your email address.');
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });

    if (error || !authData.user) {
      throw new AuthError('IncorrectPassword', 'Incorrect email or password.');
    }

    const userDoc = await UserRepository.getUserByAuthId(authData.user.id);
    if (!userDoc || userDoc.suspended) {
      await supabase.auth.signOut({ scope: 'local' });
      clearAllSupabaseCookies();
      throw userDoc
        ? new AuthError('AccountSuspended', 'This account has been suspended by the Editorial Board.')
        : new AuthError('UserNotFound', 'No Adjung profile is linked to this account.');
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

  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  static async signOut(): Promise<void> {
    // Awaited (not fire-and-forget): a caller that immediately does a
    // hard-redirect (e.g. leaving a personal-site subdomain on logout) can
    // otherwise interrupt this mid-flight, landing on the new page still
    // carrying the old session.
    try {
      // scope: 'local' — the default ('global') revokes the refresh token
      // for every session of this account, so clicking Sign Out in one tab
      // silently logged the user out of every other device/tab too.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('Supabase signout failed:', err);
    }
    // Verified live: supabase.auth.signOut() alone did not reliably clear
    // the session cookie via cookieStorage's removeItem — the cookie
    // survived a full sign-out, so clear it explicitly rather than trust
    // that internal path.
    clearAllSupabaseCookies();
    SessionService.destroySession();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('Adjung_acting_user_id');
    }
  }
}
