import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, ListChecks, Calendar, BarChart3, Settings } from 'lucide-react';
import { OfflineIndicator } from '@/components/ui';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: Dumbbell, label: 'Today' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/exercises', icon: ListChecks, label: 'Exercises' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col safe-area-top">
      {/* Offline indicator */}
      <OfflineIndicator />
      
      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-elevated safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to));
            
            return (
              <NavLink
                key={to}
                to={to}
                className={`
                  flex flex-col items-center justify-center w-full h-full
                  transition-colors
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="mt-1 font-medium text-2xs">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
