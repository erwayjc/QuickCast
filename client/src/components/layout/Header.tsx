import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid, List, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export const Header: FC<HeaderProps> = ({ view, onViewChange }) => {
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center flex-1 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('grid')}
            className="rounded-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <img src={user.photoURL || ''} alt={user.displayName || 'User'} />
              </Avatar>
              <span className="text-sm font-medium">{user.displayName}</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button onClick={signInWithGoogle}>
            Sign in with Google
          </Button>
        )}

        {user && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </div>
    </div>
  );
}