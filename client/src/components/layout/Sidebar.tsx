import { FC } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  FileText,
  Layout
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavItem: FC<NavItemProps> = ({ href, icon, children, isActive }) => (
  <Link href={href}>
    <a className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive 
        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
    )}>
      {icon}
      {children}
    </a>
  </Link>
);

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold text-sidebar-foreground">QuickCast</h1>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <NavItem 
          href="/" 
          icon={<Layout className="w-4 h-4" />}
          isActive={location === '/'}
        >
          Projects
        </NavItem>
        <NavItem 
          href="/recordings" 
          icon={<Mic className="w-4 h-4" />}
          isActive={location === '/recordings'}
        >
          Quick recordings
        </NavItem>
        <NavItem 
          href="/templates" 
          icon={<FileText className="w-4 h-4" />}
          isActive={location === '/templates'}
        >
          Templates
        </NavItem>
      </nav>
    </div>
  );
}