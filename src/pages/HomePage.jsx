// frontend/src/pages/HomePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Removed duplicate imports
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../firebase';

function HomePage() {
  const [roomCode, setRoomCode] = useState('');
  const [maxGuests, setMaxGuests] = useState(10);
  const [guestName, setGuestName] = useState(''); // State for guest name input
  const [showGuestOptions, setShowGuestOptions] = useState(false); // State to show create/join after guest name

  const socket = useSocket();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext

  const handleCreateRoom = () => {
    // Check if logged in OR guest name is saved
    const currentGuestName = sessionStorage.getItem('guestName');
    if (!user && !currentGuestName) return alert("Please sign in or enter a guest name first.");
    
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
    // Check if logged in OR guest name is saved
    const currentGuestName = sessionStorage.getItem('guestName');
    if (!user && !currentGuestName) return alert("Please sign in or enter a guest name first.");
    if (!roomCode) return alert("Please enter a room code.");

    // Just navigate, server will handle if room exists and is full
    navigate(`/room/${roomCode}`);
  };

  // Handler for "Continue as Guest" button
  const handleGuestContinue = () => {
    const trimmedName = guestName.trim();
    if (!trimmedName) return;
    sessionStorage.setItem('guestName', trimmedName); // Save guest name
    setGuestName(trimmedName); // Update state to show the name
    setShowGuestOptions(true); // Show create/join options
  };

  // Handler for "Back" button when guest options are shown
  const handleGuestBack = () => {
      sessionStorage.removeItem('guestName');
      setShowGuestOptions(false);
      setGuestName(''); // Clear the input field too
  };


  if (!socket) {
    return <div className="flex items-center justify-center min-h-screen">Connecting to server...</div>;
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
              <div>
                <p className="text-white">Welcome,</p>
                <p className="text-white font-semibold">{user.displayName}!</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-400 mb-1">Max Guests</label>
            <input
              type="number"
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              min="2"
              max="50"
              className="w-full p-3 mb-4 text-gray-900 rounded-md bg-gray-200 border border-gray-400 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full p-3 mb-4 text-gray-900 rounded-md bg-gray-200 border border-gray-400 focus:ring-purple-500 focus:border-purple-500"
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
              className="w-full mt-6 text-sm text-gray-400 hover:text-white"
            >
              Sign Out
            </button>
          </>
        ) : (
          // --- User is Logged Out ---
          <>
            {!showGuestOptions ? (
              // --- Show Login / Guest Name Input ---
              <>
                <button
                  onClick={signInWithGoogle}
                  className="w-full p-3 mb-4 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                >
                  Sign In with Google
                </button>

                <hr className="my-6 border-gray-600" />
                <h3 className="text-center text-gray-400 mb-3 text-sm">OR</h3>
                
                <input
                  type="text"
                  placeholder="Enter a guest name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 mb-3 text-gray-900 rounded-md bg-gray-200 border border-gray-400 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleGuestContinue}
                  disabled={!guestName.trim()}
                  className="w-full p-3 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Continue as Guest
                </button>

                {/* FAQ Section */}
                <div className="mt-8 text-gray-300 text-sm">
                  <h2 className="text-lg font-semibold text-purple-300 mb-3">Questions?</h2>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-100 mb-1">1. What is this site for?</h3>
                    <p>This is a virtual party room where you and your friends can listen to YouTube music together in perfect sync!</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-100 mb-1">2. How do I use this site?</h3>
                    <p>Sign in or enter a guest name. Create a room (you'll get a code) or join using a code. Share the code/link with friends. Search for songs, suggest them, vote, and chat!</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 mb-1">3. Why should I log in?</h3>
                    <p>Logging in saves your chat history across sessions and shows your Google name/photo. Guests only keep chat history for the current session.</p>
                  </div>
                </div>
              </>
            ) : (
              // --- Show Guest Create/Join Options ---
              <>
                <p className="text-center mb-4 text-white">Continuing as guest: <span className="font-semibold">{guestName}</span></p>

                <label className="block text-sm font-medium text-gray-400 mb-1">Max Guests</label>
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  min="2"
                  max="50"
                  className="w-full p-3 mb-4 text-gray-900 rounded-md bg-gray-200 border border-gray-400 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full p-3 mb-4 text-gray-900 rounded-md bg-gray-200 border border-gray-400 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="w-full p-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                  >
                    Join Room
                  </button>
                </form>

                <button
                  onClick={handleGuestBack}
                  className="w-full mt-6 text-sm text-gray-400 hover:text-white"
                >
                  Go Back (Change Name/Login)
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;