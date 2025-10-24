// frontend/src/components/Player.jsx
import React, { useEffect } from 'react';
import YouTube from 'react-youtube';

function Player({ videoId, playerRef, amIHost, onHostStateChange }) {
  
  const opts = {
    height: '390',
    width: '100%', // Fills container
    playerVars: {
      autoplay: 1, // Autoplay the new video
      controls: amIHost ? 1 : 0, // Show controls only for host
      disablekb: amIHost ? 0 : 1, // Disable keyboard for guests
      modestbranding: 1,
      fs: 0, // Disable fullscreen for simplicity
    },
  };

  const onReady = (event) => {
  // Bas player object ko ref mein store kar do
  playerRef.current = event.target;
};

  const onStateChange = (event) => {
    // Humne 'amIHost' check yahan se hata diya hai
    onHostStateChange(event.data);
  };
  

  // We use the `key` prop to force React to re-create the YouTube
  // component when the videoId changes. This is the simplest
  // way to load a new video and trigger autoplay.
  return (
    <div className="aspect-video w-full">
      {videoId ? (
        <YouTube
          key={videoId} 
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <p className="text-gray-400">Waiting for host to select a video...</p>
        </div>
      )}
    </div>
  );
}

export default Player;