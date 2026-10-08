import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AppUser | undefined>;
  signup: (email: string, pass: string, name: string, role?: string, studentId?: string, department?: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const docRef = doc(db, 'users', fUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(docSnap.data() as AppUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const docRef = doc(db, 'users', cred.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const u = docSnap.data() as AppUser;
      setUser(u);
      return u;
    }
  };

  const signup = async (email: string, pass: string, name: string, role = "student", studentId?: string, department?: string) => {
    const { user: newFUser } = await createUserWithEmailAndPassword(auth, email, pass);
    const appUser: AppUser = {
      uid: newFUser.uid,
      email,
      name,
      role: role as any,
      studentId: studentId || '',
      department: department || '',
      followedClubIds: [],
      savedEventIds: [],
      savedResourceIds: [],
    };
    await setDoc(doc(db, 'users', newFUser.uid), appUser);
    setUser(appUser);
    return appUser;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
