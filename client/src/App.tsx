import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/layout/MainLayout";
import Home from "@/pages/Home";
import Auth from "@/pages/auth";
import Templates from "@/pages/templates";
import EpisodeDraftPage from "@/pages/Episodedraftpage"; 
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

// Types for our context
interface AudioContextType {
  transcribe: (id: number) => Promise<void>;
  isTranscribing: boolean;
}

// Create an audio context to share player state
import { createContext, useContext, useState } from 'react';

export const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribe = async (id: number) => {
    try {
      setIsTranscribing(true);

      // First, ensure we have the episode information with the correct audio URL
      const episodeResponse = await fetch(`/api/episodes/${id}`);
      if (!episodeResponse.ok) {
        const error = await episodeResponse.json();
        throw new Error(error.message || 'Failed to get episode information');
      }

      const episode = await episodeResponse.json();

      // Make sure we have a valid audio URL
      if (!episode.audioUrl) {
        throw new Error('No audio URL found for this episode');
      }

      // Get absolute URL if it's relative
      const audioUrl = episode.audioUrl.startsWith('http') 
        ? episode.audioUrl 
        : new URL(episode.audioUrl, window.location.origin).toString();

      // Send the transcription request with the properly formatted URL
      const response = await fetch(`/api/episodes/${id}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transcription failed');
      }

      // Invalidate the episodes query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/episodes'] });
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <AudioContext.Provider value={{ transcribe, isTranscribing }}>
      {children}
    </AudioContext.Provider>
  );
}

// Hook to use the audio context
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

// Protected Route Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />

      <Route path="/">
        <ProtectedRoute component={() => (
          <MainLayout>
            <Home />
          </MainLayout>
        )} />
      </Route>

      <Route path="/templates">
        <ProtectedRoute component={() => (
          <MainLayout>
            <Templates />
          </MainLayout>
        )} />
      </Route>

      {/* New route for episode drafts */}
      <Route path="/draft/:id">
        {(params) => (
          <ProtectedRoute component={() => (
            <MainLayout>
              <EpisodeDraftPage id={params.id} />
            </MainLayout>
          )} />
        )}
      </Route>

      {/* Route for creating new drafts */}
      <Route path="/draft/new">
        <ProtectedRoute component={() => (
          <MainLayout>
            <EpisodeDraftPage />
          </MainLayout>
        )} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <Router />
        <Toaster />
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;