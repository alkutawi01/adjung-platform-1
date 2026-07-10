import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  setDoc
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { User, UserRole, RolePermissions, SystemSettings } from '../types';
import { firestoreService } from '../utils/firestoreService';

// ==========================================
// 1. User Repository (Unified Lookup Engine)
// ==========================================
export class UserRepository {
  static async getUserByUsernameOrEmail(identifier: string): Promise<User | undefined> {
    const normalized = identifier.trim().toLowerCase();
    
    // Check if email
    let q = query(collection(firestore, 'users'), where('email', '==', normalized));
    let snap = await getDocs(q);
    
    if (snap.empty) {
      // Check if username
      q = query(collection(firestore, 'users'), where('username', '==', normalized));
      snap = await getDocs(q);
    }
    
    if (snap.empty) return undefined;
    const docData = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      username: docData.username,
      email: docData.email,
      role: docData.role,
      penName: docData.penName,
      signature: docData.signature,
      avatarColor: docData.avatarColor || '',
      bioSummary: docData.bioSummary || '',
      suspended: !!docData.suspended,
      affiliation: docData.affiliation || ''
    };
  }
}

// ==========================================
// 2. RBAC Service (Role-Based Access Control)
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
// 3. Session Service (State Preservation & Audit)
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
// 4. Authentication Service (Pipeline Implementation)
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
    // 1. Resolve user email from Firestore
    const userDoc = await UserRepository.getUserByUsernameOrEmail(usernameOrEmailInput);
    if (!userDoc) {
      throw new AuthError('UserNotFound', 'Username or email not registered on Adjung.');
    }

    if (userDoc.suspended) {
      throw new AuthError('AccountSuspended', 'This account has been suspended by the Editorial Board.');
    }

    // 2. Perform authentication with Firebase Auth (supporting lazy migration)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, userDoc.email, passwordInput);
      const user = userDoc;
      SessionService.createSession(user, rememberMe);
      return user;
    } catch (firebaseErr: any) {
      // If user does not exist in Auth but exists in Firestore (Lazy Auth Creation)
      if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
        // Fetch migrated plain-text password from Firestore
        const snap = await getDocs(query(collection(firestore, 'users'), where('email', '==', userDoc.email)));
        if (!snap.empty) {
          const rawData = snap.docs[0].data();
          const correctPassword = rawData.password || 'password';
          
          if (passwordInput === correctPassword) {
            // Dynamically register them in Firebase Auth
            const newUserCred = await createUserWithEmailAndPassword(auth, userDoc.email, passwordInput);
            SessionService.createSession(userDoc, rememberMe);
            return userDoc;
          }
        }
      }
      throw new AuthError('IncorrectPassword', 'The password entered is incorrect.');
    }
  }

  static async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      
      const userDoc = await UserRepository.getUserByUsernameOrEmail(fbUser.email || '');
      if (!userDoc) {
        await fbSignOut(auth);
        throw new AuthError('UserNotFound', `Email ${fbUser.email} is not registered on Adjung.`);
      }
      
      if (userDoc.suspended) {
        await fbSignOut(auth);
        throw new AuthError('AccountSuspended', 'This account has been suspended by the Editorial Board.');
      }
      
      SessionService.createSession(userDoc, true);
      return userDoc;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      console.error('Google Sign-In Error:', err);
      throw new AuthError('AuthFailed', err.message || 'Google authentication failed.');
    }
  }

  static async signInWithPreset(username: string): Promise<User> {
    return this.signIn(username, 'password', true);
  }

  static async resetPassword(email: string, newPasswordInput: string): Promise<void> {
    // Check if user exists in Firestore
    const userDoc = await UserRepository.getUserByUsernameOrEmail(email);
    if (!userDoc) {
      throw new Error('No account found with this email.');
    }

    // Update password in Firestore
    const userRef = doc(firestore, 'users', userDoc.id);
    await setDoc(userRef, { password: newPasswordInput }, { merge: true });

    // Send reset link or update credentials if logged in
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.warn('Firebase password reset email skipped: ', e);
    }
  }

  static signOut(): void {
    fbSignOut(auth).catch(err => console.error('Firebase signout failed:', err));
    SessionService.destroySession();
  }
}
