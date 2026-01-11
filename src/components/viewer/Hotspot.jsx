import { useCallback } from 'react';

/**
 * Component hiển thị một hotspot trên panorama
 */
const Hotspot = ({ hotspot, onSceneChange, setHotspotRef }) => {
  const handleClick = useCallback(() => {
    if (hotspot.type === 'click') {
      onSceneChange(hotspot.targetScene);
    }
  }, [hotspot, onSceneChange]);

  return (
    <div
      ref={setHotspotRef(hotspot.id)}
      className={`hotspot hotspot-${hotspot.type}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        willChange: 'transform'
      }}
      onClick={handleClick}
    >
      <div className="hotspot-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.96 2 6.5 4.46 6.5 7.5C6.5 11.28 11.34 16.47 11.56 16.71C11.82 16.99 12.18 16.99 12.44 16.71C12.66 16.47 17.5 11.28 17.5 7.5C17.5 4.46 15.04 2 12 2ZM12 9.5C10.9 9.5 10 8.6 10 7.5C10 6.4 10.9 5.5 12 5.5C13.1 5.5 14 6.4 14 7.5C14 8.6 13.1 9.5 12 9.5Z" />
        </svg>
      </div>
      {hotspot.label && (
        <div className="hotspot-label">
          {hotspot.label}
        </div>
      )}
    </div>
  );
};

export default Hotspot;
