import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { 
  TodayPage, 
  ExercisesPage, 
  ExerciseDetailPage, 
  ProgressPage, 
  SettingsPage,
  SchedulePage 
} from './pages';
import { useAppStore } from './stores/appStore';
import { AuthProvider, SyncProvider } from './contexts';

function App() {
  const theme = useAppStore(state => state.theme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
