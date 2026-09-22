import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { AppleNavbar } from './components/AppleNavbar';
import { ChatFeed } from './components/ChatFeed';
import { MessageComposer } from './components/MessageComposer';
import { InspectorSidebar } from './components/InspectorSidebar';
import { AuthModal } from './components/AuthModal';

function AppContent() {
  const { user, token, isAuthenticated, openAuthModal } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [username, setUsername] = useState(
    () => localStorage.getItem('ps_username') || `User_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [prefillValue, setPrefillValue] = useState('');

  // Sync username whenever authenticated user changes
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const {
    url,
    updateUrl,
    status,
    messages,
    telemetry,
    latency,
    soundEnabled,
    setSoundEnabled,
    connect,
    disconnect,
    sendMessage,
    sendPing,
    clearMessages,
    clearTelemetry,
  } = useWebSocket('ws://127.0.0.1:8000/ws', token);

  const handleUpdateUsername = (newName) => {
    setUsername(newName);
    localStorage.setItem('ps_username', newName);
  };

  const handleSend = (text) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    sendMessage(text, username);
  };

  const handleConnectClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    connect(url);
  };

  const handleSelectPrompt = (promptText) => {
    setPrefillValue(promptText);
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-[#000000] text-[#1d1d1f] antialiased overflow-hidden select-none font-sans">
      {/* Apple 2-Tier Navbar: Global Nav + Sub-Nav */}
      <AppleNavbar
        url={url}
        onUpdateUrl={updateUrl}
        status={status}
        latency={latency}
        onConnect={handleConnectClick}
        onDisconnect={disconnect}
        onPing={sendPing}
        onClear={clearMessages}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-10 bg-[#000000]">
        {/* Chat Stream Section */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#000000]">
          {/* Chat Feed */}
          <ChatFeed
            messages={messages}
            onSelectPrompt={handleSelectPrompt}
            isAuthenticated={isAuthenticated}
            onRequireAuth={(tab) => openAuthModal(tab || 'login')}
          />

          {/* Message Composer Dock */}
          <MessageComposer
            onSendMessage={handleSend}
            isConnected={status === 'connected'}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => openAuthModal('login')}
            prefillValue={prefillValue}
            onClearPrefill={() => setPrefillValue('')}
          />
        </section>

        {/* Inspector Sidebar */}
        <InspectorSidebar
          isOpen={isSidebarOpen}
          telemetry={telemetry}
          onClearTelemetry={clearTelemetry}
          username={username}
          onUpdateUsername={handleUpdateUsername}
        />
      </div>

      {/* Authentication Modal (POST /login & POST /register) */}
      <AuthModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
