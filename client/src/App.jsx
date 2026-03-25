import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
          <p>Loading NexusChat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;
  
  if (showAdmin && user?.isAdmin) {
    return (
      <SocketProvider>
        <AdminDashboard onGoBack={() => setShowAdmin(false)} />
      </SocketProvider>
    );
  }

  return (
    <SocketProvider>
      <ChatPage onOpenAdmin={() => setShowAdmin(true)} />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
