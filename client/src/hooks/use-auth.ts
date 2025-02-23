import { useState, useEffect } from "react";
import { 
  signInWithRedirect,
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
    console.log('Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result when component mounts
    console.log('Checking for redirect result');
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect result success:', result.user.email);
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.user.email}`,
          });
        } else {
          console.log('No redirect result');
        }
      })
      .catch((error) => {
        console.error("Auth Error:", error);
        const errorMessage = error.code === 'auth/configuration-not-found' 
          ? 'Firebase configuration error. Please check your Firebase setup.'
          : `Failed to sign in with Google: ${error.message}`;

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    try {
      console.log('Initiating Google sign in...');
      console.log('Auth state before sign in:', auth.currentUser);
      console.log('Provider:', googleProvider);

      await signInWithRedirect(auth, googleProvider).catch(error => {
        throw error; // Re-throw to be caught by the outer catch
      });

      console.log('Sign in redirect initiated successfully');
    } catch (error: any) {
      console.error("Sign in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      const errorMessage = 
        error.code === 'auth/configuration-not-found' 
          ? 'Firebase configuration error. Please check your Firebase setup.'
          : error.code === 'auth/popup-blocked'
          ? 'Popup was blocked. Please allow popups for this site.'
          : error.code === 'auth/cancelled-popup-request'
          ? 'Authentication cancelled. Please try again.'
          : `Failed to initiate sign in: ${error.message}`;

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      console.log('Initiating logout');
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
    signInWithGoogle,
    logout,
  };
}