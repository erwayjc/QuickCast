import { useState, useEffect } from "react";
import { 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  getRedirectResult
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Handle redirect results when component mounts
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Google sign-in successful:', result.user.email);
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.user.email}`,
          });
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        toast({
          title: "Error",
          description: "Failed to complete sign-in process",
          variant: "destructive",
        });
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('Attempting to create account:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Account created successfully:', result.user.email);
      toast({
        title: "Welcome to QuickCast!",
        description: `Account created successfully as ${result.user.email}`,
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      const errorMessage = 
        error.code === 'auth/email-already-in-use'
          ? 'An account already exists with this email'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : error.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters'
          : error.code === 'auth/configuration-not-found'
          ? 'Authentication service is not properly configured. Please try again later.'
          : 'Failed to create account';

      throw new Error(errorMessage);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
      toast({
        title: "Welcome back!",
        description: `Signed in as ${result.user.email}`,
      });
    } catch (error: any) {
      console.error("Sign in error:", error);

      const errorMessage = 
        error.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : error.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : error.code === 'auth/configuration-not-found'
          ? 'Authentication service is not properly configured. Please try again later.'
          : 'Failed to sign in';

      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign in...');
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate sign in with Google",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
  };
}