import { useState, useEffect } from "react";
import { 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: `Signed in as ${result.user.email}`,
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(
        error.code === 'auth/wrong-password'
          ? 'Incorrect password'
          : error.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : 'Failed to sign in'
      );
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome to QuickCast!",
        description: `Account created successfully as ${result.user.email}`,
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(
        error.code === 'auth/email-already-in-use'
          ? 'An account already exists with this email'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : error.code === 'auth/weak-password'
          ? 'Password is too weak'
          : 'Failed to create account'
      );
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
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