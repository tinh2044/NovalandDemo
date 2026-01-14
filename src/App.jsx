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
  const [sceneHistory, setSceneHistory] = useState([]); // Stack để lưu lịch sử scene

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

  const handleSceneChange = useCallback((targetSceneId, fromSceneId = null, isBack = false) => {
    if (targetSceneId === currentSceneId || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Lưu scene_id hiện tại vào history khi click hotspot (không phải back)
    if (!isBack && fromSceneId && fromSceneId !== targetSceneId) {
      setSceneHistory(prev => [...prev, fromSceneId]);
    }
    
    setTimeout(() => {
      setCurrentSceneId(targetSceneId);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  }, [currentSceneId, isTransitioning]);

  const handleBack = useCallback(() => {
    if (sceneHistory.length === 0 || isTransitioning) return;
    
    // Lấy scene cuối cùng trong history
    const previousSceneId = sceneHistory[sceneHistory.length - 1];
    
    // Xóa scene cuối cùng khỏi history
    setSceneHistory(prev => prev.slice(0, -1));
    
    // Chuyển về scene trước đó
    handleSceneChange(previousSceneId, null, true);
  }, [sceneHistory, isTransitioning, handleSceneChange]);

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
        {sceneHistory.length > 0 && (
          <button 
            className="btn-back-scene"
            onClick={handleBack}
            title="Quay lại scene trước"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Quay lại</span>
          </button>
        )}
      </header>

      {currentScene && (
        <Viewer
          scene={currentScene}
          currentSceneId={currentSceneId}
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
