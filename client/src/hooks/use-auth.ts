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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Check for redirect result when component mounts
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.user.email}`,
          });
        }
      })
      .catch((error) => {
        console.error("Auth Error:", error);
        toast({
          title: "Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
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
    signInWithGoogle,
    logout,
  };
}