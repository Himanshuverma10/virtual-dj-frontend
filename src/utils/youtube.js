// frontend/src/utils/youtube.js
// Basic parser to get video ID from various YouTube URL formats
export function getYouTubeId(url) {
  if (!url) return null;
  // Regex to find video ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  } else {
    // If no match, assume it's a raw ID
    // Basic check: 11 chars, no spaces
    if (url.length === 11 && !url.includes(' ')) {
        return url;
    }
    return null; // Not a valid ID or URL
  }
}

// Simple function to fetch video title (requires a backend proxy to avoid CORS)
// For MVP, we'll just use the ID as the title
// A proper implementation would have the backend fetch this
export async function getYouTubeTitle(videoId) {
    // This will be blocked by CORS if called from client
    // In a real app, create a backend endpoint: /api/video-title?id=VIDEO_ID
    // that fetches this URL and returns the JSON.
    // For now, we return a placeholder.
    console.warn("getYouTubeTitle requires a backend proxy to work due to CORS.")
    return `Video (${videoId})`;
}