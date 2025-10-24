// frontend/src/pages/HomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext'; // <-- NEW
import { signInWithGoogle, signOut } from '../firebase'; // <-- NEW

function HomePage() {
  const [roomCode, setRoomCode] = useState('');
  const [maxGuests, setMaxGuests] = useState(10);

  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- Get user from AuthContext

  const handleCreateRoom = () => {
    if (!user) return alert("Please sign in first.");

    socket.emit('create-room', { maxGuests }, (response) => {
      if (response.success) {
        navigate(`/room/${response.roomId}`);
      } else {
        alert('Failed to create room.');
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!user) return alert("Please sign in first.");
    if (!roomCode) return alert("Please enter a room code.");

    // We don't need to check room here, server will do it
    navigate(`/room/${roomCode}`);
  };

  if (!socket) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8 text-purple-400">Virtual DJ</h1>

      <div className="w-full max-w-sm p-6 bg-gray-800 rounded-lg shadow-md">
        {user ? (
          // --- User is Logged In ---
          <>
            <div className="flex items-center mb-4">
              <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full mr-3" />
              <p className="text-white">Welcome, {user.displayName}!</p>
            </div>

            <label className="text-sm text-gray-400 mb-1">Max Guests</label>
            <input
              type="number"
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              min="2"
              max="50"
              className="w-full p-3 mb-4 text-gray-900 rounded-md"
            />

            <button
              onClick={handleCreateRoom}
              className="w-full p-3 mb-4 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition"
            >
              Create New Party Room
            </button>

            <hr className="my-4 border-gray-600" />

            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full p-3 mb-4 text-gray-900 rounded-md"
              />
              <button
                type="submit"
                className="w-full p-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
              >
                Join Room
              </button>
            </form>

            <button
              onClick={signOut}
              className="w-full mt-4 text-gray-400 hover:text-white"
            >
              Sign Out
            </button>
          </>
        ) : (
          // --- User is Logged Out ---
          <button
            onClick={signInWithGoogle}
            className="w-full p-3 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </div>
  );
}

export default HomePage;