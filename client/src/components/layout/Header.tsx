import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, Grid, List, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export const Header: FC<HeaderProps> = ({ view, onViewChange }) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 border-b border-white/10 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="flex items-center flex-1 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search episodes..." 
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1 border border-white/10 rounded-md">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('grid')}
            className="rounded-none text-zinc-400 hover:text-white"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('list')}
            className="rounded-none text-zinc-400 hover:text-white"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-emerald-500/20">
                <img src={user.photoURL || ''} alt={user.displayName || 'User'} />
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{user.displayName}</span>
                <span className="text-xs text-zinc-400">{user.email}</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8 bg-white/10" />
            <Button variant="ghost" size="icon" onClick={logout} className="text-zinc-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Episode
            </Button>
          </>
        )}
      </div>
    </div>
  );
};