import { useState, useCallback, useEffect } from 'react';
import Viewer from './components/Viewer';
import { tourAPI } from './services/api';

// const DEFAULT_TOUR_ID = '6787a1b2c3d4e5f6a7b8c9d0';
const DEFAULT_TOUR_ID = '69661dfa5a3d3057d1ec3e3b';

function App() {
  const [tourData, setTourData] = useState(null);
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTour = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await tourAPI.export(DEFAULT_TOUR_ID);
        setTourData(data);
        // console.log()
        setCurrentSceneId(Object.keys(data.scenes)[0]);
      } catch (err) {
        console.error('Failed to load tour:', err);
        setError(err.message || 'Không thể tải tour');
      } finally {
        setIsLoading(false);
      }
    };

    loadTour();
  }, []);

  const currentScene = tourData?.scenes?.[currentSceneId];
  const allScenes = tourData ? Object.values(tourData.scenes) : [];

  const handleSceneChange = useCallback((targetSceneId) => {
    if (targetSceneId === currentSceneId || isTransitioning) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentSceneId(targetSceneId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  }, [currentSceneId, isTransitioning]);

  const handleViewerReady = useCallback(() => {
  }, []);

  if (error) {
    return (
      <div className="tour-container">
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h2>Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !tourData) {
    return (
      <div className="tour-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-text">Đang tải tour...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-container">
      <div className={`scene-transition ${isTransitioning ? 'active' : ''}`} />

      <header className="tour-header">
        <div className="logo">NOVALAND</div>
      </header>

      {currentScene && (
        <Viewer
          scene={currentScene}
          onSceneChange={handleSceneChange}
          onReady={handleViewerReady}
        />
      )}

      {currentScene && (
        <div className="scene-info">
          <h2>{currentScene.name}</h2>
          <p>{currentScene.description}</p>
        </div>
      )}

      <div className="scene-navigator">
        {allScenes.map((scene) => (
          <button
            key={scene.id}
            className={`nav-dot ${scene.id === currentSceneId ? 'active' : ''}`}
            onClick={() => handleSceneChange(scene.id)}
            title={scene.name}
          />
        ))}
      </div>

      <div className="controls-help">
        <div className="control-item">
          <kbd>Kéo</kbd>
          <span>Xoay</span>
        </div>
        <div className="control-item">
          <kbd>Cuộn</kbd>
          <span>Zoom</span>
        </div>
        <div className="control-item">
          <kbd>Nhấn</kbd>
          <span>Đi</span>
        </div>
      </div>
    </div>
  );
}

export default App;
