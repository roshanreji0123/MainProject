import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthError,
  AuthErrorCodes,
  UserCredential
} from 'firebase/auth';

interface AuthFormProps {
  type: 'login' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userCredential: UserCredential;

      if (type === 'signup') {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile with name
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name || email.split('@')[0]
          });
        }
      } else {
        // Login existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // Set user in context with all required fields
      setUser({
        email: userCredential.user.email,
        name: userCredential.user.displayName || email.split('@')[0],
        notesCount: 0,
        uid: userCredential.user.uid
      });

      // Navigate to the protected page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const firebaseError = err as AuthError;
      let errorMessage = 'An error occurred during authentication';

      switch (firebaseError.code) {
        case AuthErrorCodes.EMAIL_EXISTS:
          errorMessage = 'This email is already registered. Please try logging in instead.';
          break;
        case AuthErrorCodes.INVALID_PASSWORD:
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case AuthErrorCodes.USER_DELETED:
          errorMessage = 'No account found with this email. Please sign up first.';
          break;
        case AuthErrorCodes.WEAK_PASSWORD:
          errorMessage = 'Password should be at least 6 characters long.';
          break;
        case AuthErrorCodes.INVALID_EMAIL:
          errorMessage = 'Please enter a valid email address.';
          break;
        case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case AuthErrorCodes.NETWORK_REQUEST_FAILED:
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = firebaseError.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {type === 'signup' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#374151]">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 shadow-sm focus:border-[#FF7A59] focus:ring-2 focus:ring-[#FF7A59]/20 focus:outline-none transition-all duration-200"
            placeholder="Enter your name"
          />
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#374151]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 shadow-sm focus:border-[#FF7A59] focus:ring-2 focus:ring-[#FF7A59]/20 focus:outline-none transition-all duration-200"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 shadow-sm focus:border-[#FF7A59] focus:ring-2 focus:ring-[#FF7A59]/20 focus:outline-none transition-all duration-200"
          placeholder="Enter your password"
          required
          minLength={6}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#FF7A59] hover:bg-[#FF7A59]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7A59] transition-all duration-200 transform hover:scale-105",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            {type === 'signup' ? 'Signing up...' : 'Logging in...'}
          </>
        ) : (
          type === 'signup' ? 'Sign Up' : 'Log In'
        )}
      </button>
    </form>
  );
}