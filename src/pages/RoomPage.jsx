// frontend/src/pages/RoomPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Player from '../components/Player';
import Chat from '../components/Chat';
import axios from 'axios';

// Get the backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth(); // Get user from context

  // State
  const [amIHost, setAmIHost] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Copy/Ready State
  const [copied, setCopied] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [pendingSync, setPendingSync] = useState(null);
  
  // Refs
  const playerRef = useRef(null);
  const lastEmittedState = useRef(null);

  // Cooldown state
  const [cooldown, setCooldown] = useState(0);
  const [suggestionError, setSuggestionError] = useState(null);
  
  // Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState({ sending: false, message: null, isError: false });


  // --- Main Socket Effect ---
  useEffect(() => {
    if (!socket) return;
    
    // Auth Check
    const guestName = sessionStorage.getItem('guestName');
    if (!user && !guestName) { // Agar logged in bhi nahi hai AUR guest bhi nahi hai
      console.log("No user or guest found, redirecting to login.");
      navigate('/', { state: { from: location.pathname } }); 
      return;
    }

    // --- SOCKET EVENT LISTENERS ---
    
    socket.on('room-state', (state) => {
      console.log('Received room state:', state);
      setQueue(state.queue);
      setMessages(state.chat); // Chat history from Firestore
      setCurrentVideoId(state.currentVideoId);

      const isHost = (socket.id === state.hostId);
      setAmIHost(isHost);

      if (isHost) {
        setUserReady(true); // Host is always ready
      } else {
        setPendingSync(state); // Store sync data for guest
      }
    });

    socket.on('sync-playback', ({ type, time }) => {
      if (amIHost || !userReady) return; 
      if (!playerRef.current || !playerRef.current.getPlayerState) {
        console.warn('Sync event aaya, lekin player ready nahi hai.');
        return;
      }
      console.log(`Syncing to ${type} at ${time}s`); 
      playerRef.current.seekTo(time, true);
      if (type === 'PLAY') {
        playerRef.current.playVideo();
      } else if (type === 'PAUSE') {
        playerRef.current.pauseVideo();
      }
    });

    socket.on('set-video', ({ videoId, queue }) => {
      setCurrentVideoId(videoId);
      setQueue(queue);
    });

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('update-queue', (newQueue) => {
      setQueue(newQueue);
    });

    socket.on('host-left', (message) => {
      alert(message);
      navigate('/');
    });

    // --- Emit Join Room ---
    const joinData = { roomId };
    if (user) {
      joinData.user = { displayName: user.displayName, uid: user.uid };
    } else if (guestName) {
      joinData.guestName = guestName;
    }

    socket.emit('join-room', joinData, (response) => {
      if (!response.success) {
        alert(response.message);
        // Agar guest join fail ho, toh guest name clear karke home bhejo
        if (guestName) sessionStorage.removeItem('guestName'); 
        navigate('/');
      }
    });

    // --- Cleanup ---
    return () => {
      socket.off('room-state');
      socket.off('sync-playback');
      socket.off('set-video');
      socket.off('new-message');
      socket.off('update-queue');
      socket.off('host-left');
    };
  }, [socket, roomId, navigate]); // Note: amIHost removed


  // --- Guest Sync Effect ---
  useEffect(() => {
    // This runs when the player is ready, user is ready, AND sync data exists
    if (userReady && pendingSync && playerRef.current && playerRef.current.getPlayerState) {
      
      console.log(`Syncing guest (useEffect): ${pendingSync.playbackState} at ${pendingSync.lastSeekTime}s`);
      
      playerRef.current.seekTo(pendingSync.lastSeekTime, true);
      if (pendingSync.playbackState === 'PLAYING') {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      
      setPendingSync(null); // Clear the pending sync
    }
  }, [userReady, pendingSync, playerRef.current]); 

  // --- Cooldown Timer Effect ---
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // --- HANDLER FUNCTIONS ---

  const handleHostPlayerStateChange = (playerState) => {
    if (!playerRef.current) return;
    
    let actionType = null;
    if (playerState === 1) actionType = 'PLAY';   // 1 = playing
    if (playerState === 2) actionType = 'PAUSE';  // 2 = paused

    if (actionType && actionType !== lastEmittedState.current) {
        lastEmittedState.current = actionType;
        const currentTime = playerRef.current.getCurrentTime();
        
        console.log(`Host emitting: ${actionType} at ${currentTime}s`);
        socket.emit('host-action', {
            roomId,
            type: actionType,
            time: currentTime,
        });
        
        setTimeout(() => (lastEmittedState.current = null), 500);
    }
  };

  const handlePlayFromQueue = (videoId) => {
      console.log(`[Frontend] Play button clicked for video: ${videoId}. Am I host? ${amIHost}`); // <-- DEBUG LOG ADDED
      if (!amIHost) return;
      socket.emit('host-change-video', { roomId, videoId });
    };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/search`, {
        params: { q: searchInput }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Failed to search. Check console for details.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestTrack = (video) => {
    console.log("Suggest button clicked for video:", video);
    socket.emit('suggest-track', { 
      roomId, 
      videoId: video.id, 
      title: video.title 
    }, (response) => { 
      if (response.success) {
        setSearchInput('');
        setSearchResults([]);
        setSuggestionError(null);
        if (response.cooldownActive) {
          setCooldown(60); 
        }
      } else {
        setSuggestionError(response.message);
        setTimeout(() => setSuggestionError(null), 3000);
      }
    });
  };
  
  const handleSendMessage = (message) => {
    const guestName = sessionStorage.getItem('guestName');
    if (!user && !guestName) return; // Na user, na guest

    const messageData = { roomId, message };
    if (user) {
      messageData.user = { displayName: user.displayName, uid: user.uid };
    } else if (guestName) {
      messageData.guestName = guestName;
    }
    socket.emit('send-message', messageData);
  };

  const handleVote = (videoId) => {
    socket.emit('vote-track', { roomId, videoId });
  };

  const handlePlayTopVoted = () => {
      console.log("Play Top Voted button clicked. Am I Host?", amIHost); // <-- DEBUG LOG ADDED
      if (!amIHost) return;
      socket.emit('play-top-voted', { roomId });
    }; 

  const handleCopyLink = () => {
    const roomLink = window.location.href;
    navigator.clipboard.writeText(roomLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link.');
    });
  };

  const handleReady = () => {
    setUserReady(true); // This will trigger the sync useEffect
  };
  
  const handleFeedbackSubmit = async (e) => {
      e.preventDefault();
      if (!feedbackText.trim() || !user) return;

      setFeedbackStatus({ sending: true, message: null, isError: false });
      
      try {
        const response = await axios.post(`${BACKEND_URL}/api/feedback`, {
          message: feedbackText,
          user: { displayName: user.displayName, uid: user.uid },
          roomId: roomId 
        });
        
        setFeedbackStatus({ sending: false, message: response.data.message || 'Feedback sent!', isError: false });
        setFeedbackText(''); // Clear input
        // 3 second baad success message hata do
        setTimeout(() => setFeedbackStatus({ sending: false, message: null, isError: false }), 3000);

      } catch (error) {
        console.error("Error sending feedback:", error);
        setFeedbackStatus({ sending: false, message: 'Failed to send feedback.', isError: true });
        // 3 second baad error message hata do
        setTimeout(() => setFeedbackStatus({ sending: false, message: null, isError: false }), 3000);
      }
    };

  if (!socket) {
    return <div>Connecting...</div>;
  }

  // --- JSX (Layout) ---
  return (
    <>
      {/* --- ANIMATED BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-r from-purple-800 via-pink-700 to-red-800 bg-[size:400%_400%] animate-bg-pan"></div>

      {/* --- MAIN CONTENT (on top) --- */}
      <div className="relative z-10 flex flex-col lg:flex-row h-screen p-4 gap-4">
        
        {/* --- GUEST READY OVERLAY --- */}
        {!userReady && !amIHost && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <button
              onClick={handleReady}
              className="px-8 py-4 bg-purple-600 text-white text-2xl font-bold rounded-lg hover:bg-purple-700 animate-pulse"
            >
              Click to Join Party
            </button>
          </div>
        )}
        
        {/* === SECTION 1: SIDEBAR (Chhota wala) === */}
        <div className="lg:w-1/3 lg:max-w-sm flex-shrink-0 flex flex-col gap-4">
          
          {/* ROOM CODE & SHARE BOX */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase">Room Code</h3>
              <p className="text-2xl font-bold text-purple-300 tracking-wider">{roomId}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-md font-semibold text-white ${ copied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700' } transition-colors duration-200`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          
          {/* Player */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden min-h-[200px]">
            {amIHost !== null && (
              <Player
                videoId={currentVideoId}
                playerRef={playerRef}
                amIHost={amIHost}
                onHostStateChange={handleHostPlayerStateChange}
              />
            )}
          </div>
          
          {/* === QUEUE & SEARCH (Sidebar mein) === */}
          <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3 text-purple-300">Queue & Search</h2>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex mb-3">
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search YouTube..." className="flex-grow p-2 rounded-l-md text-gray-900"/>
              <button type="submit" disabled={isSearching} className="bg-purple-600 text-white p-2 rounded-r-md font-semibold hover:bg-purple-700 disabled:bg-gray-500">
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            {/* Search Results List */}
             {searchResults.length > 0 && (
              <div className="mb-3 border-b border-gray-700 pb-3">
                <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                {suggestionError && (<p className="text-red-400 text-sm mb-2">{suggestionError}</p>)}
                {cooldown > 0 && (<p className="text-yellow-400 text-sm mb-2"> Next suggestion in: {cooldown}s </p>)}
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map(video => (
                    <li key={video.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <img src={video.thumbnail} alt={video.title} className="w-16 h-9 rounded" />
                        <p className="font-medium text-sm">{video.title}</p>
                      </div>
                      <button onClick={() => handleSuggestTrack(video)} disabled={cooldown > 0} className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 flex-shrink-0 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Suggest
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Queue List */}
            <div className="flex flex-col overflow-y-auto h-32 lg:h-auto"> 
              {amIHost && queue.length > 0 && ( <button onClick={handlePlayTopVoted} className="mb-3 w-full p-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700" > Play Top Voted Song </button> )}
              {queue.length === 0 ? ( <p className="text-gray-400">No songs in queue.</p> ) : (
                  <ul className="space-y-2">
                  {queue.map((item) => (
                      <li key={item.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleVote(item.id)} className="flex flex-col items-center justify-center w-12 p-2 bg-gray-600 rounded hover:bg-purple-600" >
                            <span className="text-lg font-bold">{item.votes}</span> <span className="text-xs">VOTE</span>
                          </button>
                          <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-gray-400">Suggested by: {item.suggestedBy}</p>
                          </div>
                        </div>
                        {amIHost && ( <button onClick={() => handlePlayFromQueue(item.id)} className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700" > Play </button> )}
                      </li>
                  ))}
                  </ul>
              )}
            </div>
          </div> 
          
        </div> {/* <-- Sidebar ka closing div */}

        {/* === SECTION 2: MAIN CONTENT (Bada wala) === */}
        <div className="flex-grow flex flex-col gap-4 min-h-0"> 
          
          {/* Chat (Ab yeh bada hai) */}
          <div className="flex-grow min-h-0"> 
            <Chat messages={messages} onSendMessage={handleSendMessage} />
          </div>

          {/* Feedback Form (Ab yeh chat ke neeche hai) */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4"> 
            <h3 className="text-lg font-semibold text-purple-300 mb-2">Send Feedback</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Found a bug? Have a suggestion?" rows="3" className="w-full p-2 mb-2 text-gray-900 rounded-md resize-none" required />
              <button type="submit" disabled={feedbackStatus.sending} className="w-full p-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-500" >
                {feedbackStatus.sending ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
            {feedbackStatus.message && ( <p className={`mt-2 text-sm ${feedbackStatus.isError ? 'text-red-400' : 'text-green-400'}`}> {feedbackStatus.message} </p> )}
          </div>
          
        </div> {/* <-- Main content ka closing div */}
        
      </div> {/* <-- Overall container ka closing div */}
    </>
  );
}

export default RoomPage;