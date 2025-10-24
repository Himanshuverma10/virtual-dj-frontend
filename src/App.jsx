// frontend/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext'; // <-- IMPORT

function App() {
  return (
    <AuthProvider> {/* <-- WRAP HERE */}
      <SocketProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;