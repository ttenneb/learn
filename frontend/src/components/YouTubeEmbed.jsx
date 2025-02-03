import { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import PropTypes from 'prop-types';

const YouTubeEmbed = ({ videoId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    img.onload = () => setThumbnailLoaded(true);
    img.onerror = () => {
      // Fallback to default quality if maxres not available
      const fallbackImg = new Image();
      fallbackImg.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
      fallbackImg.onload = () => setThumbnailLoaded(true);
    };
  }, [videoId]);

  useEffect(() => {
    if (thumbnailLoaded && playerReady) {
      setIsLoading(false);
    }
  }, [thumbnailLoaded, playerReady]);

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg">
          {thumbnailLoaded && (
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
              }}
              alt="Video thumbnail"
              className="w-full h-full object-cover rounded-lg"
            />
          )}
        </div>
      )}
      <YouTube
        videoId={videoId}
        opts={{
          height: '100%',
          width: '100%',
          playerVars: { 
            autoplay: 0, 
            controls: 1, 
            modestbranding: 1,
            rel: 0 
          }
        }}
        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onReady={() => setPlayerReady(true)}
      />
    </div>
  );
};

YouTubeEmbed.propTypes = {
  videoId: PropTypes.string.isRequired
};

export default YouTubeEmbed;
