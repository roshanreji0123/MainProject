import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, updateProfile } from 'firebase/auth';

interface User {
  email: string | null;
  name: string | null;
  notesCount: number;
  uid: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserName: (newName: string) => Promise<void>;
  incrementNotesCount: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || null,
          notesCount: 0,
          uid: firebaseUser.uid
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserName = async (newName: string) => {
    if (!auth.currentUser) return;
    
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setUser(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      console.error('Error updating name:', error);
      throw error;
    }
  };

  const incrementNotesCount = () => {
    setUser(prev => prev ? { ...prev, notesCount: prev.notesCount + 1 } : null);
  };

  const value = {
    user,
    setUser,
    updateUserName,
    incrementNotesCount,
    loading
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7A59]"></div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}