import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from './services/storage';
import { supabase } from './lib/supabase';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { TodoView } from './views/TodoView';
import { BusinessDetailView } from './views/BusinessDetailView';
import { BookDetailView } from './views/BookDetailView';
import { BookAnalyticsView } from './views/BookAnalyticsView';
import { PortfolioAnalyticsView } from './views/PortfolioAnalyticsView';
import { SettingsView } from './views/SettingsView';
import { useAppStore } from './store';
import { Toaster } from './components/ui/sonner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAppStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const { user, setUser, logout } = useAppStore();
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();

  const isConfigured =
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
          });
        } else {
          logout();
        }
      } finally {
        setBooting(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
          });
        } else {
          logout();
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, logout, navigate]);

  const handleLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setUser({
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
    });

    navigate('/');
  };

  const handleLogout = async () => {
    await logoutUser();
    logout();
    setUser(null as any);
    navigate('/auth');
  };

  if (booting) {
    return <div className="p-6 text-slate-400 font-bold animate-pulse">Loading cashflow...</div>;
  }

  return (
    <>
      <Toaster position="top-center" />
      {!isConfigured && (
        <div className="bg-red-600 text-white p-3 text-center text-sm font-bold sticky top-0 z-[9999] shadow-lg">
          ⚠️ Supabase configuration missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.
        </div>
      )}

      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthView onLogin={handleLogin} />}
        />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardView
              user={user!}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        } />

        <Route path="/business/:businessId" element={
          <ProtectedRoute>
            <BusinessDetailView />
          </ProtectedRoute>
        } />

        <Route path="/ledger/:bookId" element={
          <ProtectedRoute>
            <BookDetailView />
          </ProtectedRoute>
        } />

        <Route path="/ledger/:bookId/analytics" element={
          <ProtectedRoute>
            <BookAnalyticsView />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <PortfolioAnalyticsView />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsView user={user!} />
          </ProtectedRoute>
        } />

        <Route path="/todos" element={
          <ProtectedRoute>
            <TodoView />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;