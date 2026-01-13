import { useState, useEffect, useCallback } from 'react';
import { 
  HiOutlineMap, 
  HiOutlinePhotograph, 
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlineArrowLeft,
  HiOutlineArrowRight
} from 'react-icons/hi';
import { tourAPI, sceneAPI, hotspotAPI } from '../services/api';
import TourManager from '../components/admin/TourManager';
import SceneManager from '../components/admin/SceneManager';
import HotspotEditor from '../components/admin/HotspotEditor';
import '../index.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('scenes');
  const [tours, setTours] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Load tours
  const loadTours = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tourAPI.getAll();
      setTours(result.items || []);
      setSelectedTour(result.items[0]);
    } catch (error) {
      showNotification('Lỗi tải danh sách tours: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load scenes by tour
  const loadScenes = useCallback(async (tourId) => {
    if (!tourId) {
      setScenes([]);
      return;
    }
    try {
      const result = await sceneAPI.getByTour(tourId);
      setScenes(result.items || []);
    } catch (error) {
      showNotification('Lỗi tải scenes: ' + error.message, 'error');
    }
  }, [showNotification]);

  // Initial load
  useEffect(() => {
    loadTours();
  }, [loadTours]);

  // Load scenes when tour selected
  useEffect(() => {
    if (selectedTour) {
      loadScenes(selectedTour.id);
    } else {
      setScenes([]);
    }
    setSelectedScene(null);
  }, [selectedTour, loadScenes]);

  // Handle tour CRUD
  const handleCreateTour = async (data) => {
    try {
      await tourAPI.create(data);
      showNotification('Tạo tour thành công!');
      loadTours();
    } catch (error) {
      showNotification('Lỗi tạo tour: ' + error.message, 'error');
    }
  };

  const handleUpdateTour = async (tourId, data) => {
    try {
      await tourAPI.update(tourId, data);
      showNotification('Cập nhật tour thành công!');
      loadTours();
    } catch (error) {
      showNotification('Lỗi cập nhật tour: ' + error.message, 'error');
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (!confirm('Xóa tour sẽ xóa tất cả scenes và hotspots. Tiếp tục?')) return;
    try {
      await tourAPI.delete(tourId);
      showNotification('Xóa tour thành công!');
      if (selectedTour?.id === tourId) {
        setSelectedTour(null);
      }
      loadTours();
    } catch (error) {
      showNotification('Lỗi xóa tour: ' + error.message, 'error');
    }
  };

  // Handle scene CRUD
  const handleCreateScene = async (formData) => {
    try {
      console.log(formData)
      await sceneAPI.create(formData);
      showNotification('Tạo scene thành công!');
      loadScenes(selectedTour.id);
    } catch (error) {
      showNotification('Lỗi tạo scene: ' + error.message, 'error');
    }
  };

  const handleUpdateScene = async (sceneId, formData) => {
    try {
      await sceneAPI.update(sceneId, formData);
      showNotification('Cập nhật scene thành công!');
      loadScenes(selectedTour.id);
    } catch (error) {
      showNotification('Lỗi cập nhật scene: ' + error.message, 'error');
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('Xóa scene sẽ xóa tất cả hotspots liên quan. Tiếp tục?')) return;
    try {
      await sceneAPI.delete(sceneId);
      
      // Xóa các hotspot trỏ đến scene này ở các scene khác
      for (const scene of scenes) {
        if (scene.id === sceneId) continue;
        try {
          const hotspotsResult = await hotspotAPI.getByScene(scene.id);
          const hotspots = hotspotsResult.items || [];
          for (const hotspot of hotspots) {
            if (hotspot.target_scene === sceneId) {
              await hotspotAPI.delete(hotspot.id);
            }
          }
        } catch (e) {
          console.error('Error cleaning hotspots:', e);
        }
      }
      
      showNotification('Xóa scene thành công!');
      if (selectedScene?.id === sceneId) {
        setSelectedScene(null);
      }
      loadScenes(selectedTour.id);
    } catch (error) {
      showNotification('Lỗi xóa scene: ' + error.message, 'error');
    }
  };

  // Handle hotspot CRUD
  const handleCreateHotspot = async (data) => {
    try {
      await hotspotAPI.create(data);
      showNotification('Tạo hotspot thành công!');
      return true;
    } catch (error) {
      showNotification('Lỗi tạo hotspot: ' + error.message, 'error');
      return false;
    }
  };

  const handleUpdateHotspot = async (hotspotId, data) => {
    try {
      await hotspotAPI.update(hotspotId, data);
      showNotification('Cập nhật hotspot thành công!');
      return true;
    } catch (error) {
      showNotification('Lỗi cập nhật hotspot: ' + error.message, 'error');
      return false;
    }
  };

  const handleUpdateHotspotPosition = async (hotspotId, position) => {
    try {
      await hotspotAPI.updatePosition(hotspotId, position);
      return true;
    } catch (error) {
      showNotification('Lỗi cập nhật vị trí: ' + error.message, 'error');
      return false;
    }
  };

  const handleDeleteHotspot = async (hotspotId) => {
    try {
      await hotspotAPI.delete(hotspotId);
      showNotification('Xóa hotspot thành công!');
      return true;
    } catch (error) {
      showNotification('Lỗi xóa hotspot: ' + error.message, 'error');
      return false;
    }
  };

  return (
    <div className="admin-container">
      {/* Notification */}
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="header-brand">
          <HiOutlineHome className="brand-icon" />
          <h1>Novaland Admin</h1>
        </div>
        <a href="/" className="btn-back">
          <span>Xem Web</span>
          <HiOutlineArrowRight />
        </a>
      </header>

      {/* Main Content */}
      <div className="admin-content">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button
              className={`nav-item ${activeTab === 'tours' ? 'active' : ''}`}
              onClick={() => setActiveTab('tours')}
            >
              <HiOutlineMap />
              <span>Tours</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'scenes' ? 'active' : ''}`}
              onClick={() => setActiveTab('scenes')}
              disabled={!selectedTour}
            >
              <HiOutlinePhotograph />
              <span>Scenes</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'hotspots' ? 'active' : ''}`}
              onClick={() => setActiveTab('hotspots')}
              disabled={!selectedScene}
            >
              <HiOutlineLocationMarker />
              <span>Hotspots</span>
            </button>
          </nav>

          {/* Tour Selection */}
          <div className="sidebar-section">
            <h3>Tour đang chọn</h3>
            <select
              value={selectedTour?.id || ''}
              onChange={(e) => {
                const tour = tours.find(t => t.id === e.target.value);
                setSelectedTour(tour || null);
              }}
            >
              <option value="">Chọn tour</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>{tour.name}</option>
              ))}
            </select>
          </div>

          {/* Scene Selection */}
          {selectedTour && (
            <div className="sidebar-section">
              <h3>Scene đang chọn</h3>
              <select
                value={selectedScene?.id || ''}
                onChange={(e) => {
                  const scene = scenes.find(s => s.id === e.target.value);
                  setSelectedScene(scene || null);
                  if (scene) setActiveTab('hotspots');
                }}
              >
                <option value="">Chọn scene</option>
                {scenes.map(scene => (
                  <option key={scene.id} value={scene.id}>{scene.name}</option>
                ))}
              </select>
            </div>
          )}
        </aside>

        {/* Main Panel */}
        <main className="admin-main">
          {loading && <div className="loading-overlay">Đang tải...</div>}

          {
            activeTab === 'tours' && (
            <TourManager
              tours={tours}
              selectedTour={selectedTour}
              onSelect={setSelectedTour}
              onCreate={handleCreateTour}
              onUpdate={handleUpdateTour}
              onDelete={handleDeleteTour}
              scenes={scenes}
            />
          )}

          {activeTab === 'scenes' && selectedTour && (
            <SceneManager
              tourId={selectedTour.id}
              scenes={scenes}
              selectedScene={selectedScene}
              onSelect={(scene) => {
                setSelectedScene(scene);
                if (scene) setActiveTab('hotspots');
              }}
              onCreate={handleCreateScene}
              onUpdate={handleUpdateScene}
              onDelete={handleDeleteScene}
            />
          )}

          {activeTab === 'hotspots' && selectedScene && (
            <HotspotEditor
              scene={selectedScene}
              allScenes={scenes}
              onCreate={handleCreateHotspot}
              onUpdate={handleUpdateHotspot}
              onUpdatePosition={handleUpdateHotspotPosition}
              onDelete={handleDeleteHotspot}
            />
          )}

          {!selectedTour && activeTab !== 'tours' && (
            <div className="empty-state">
              <HiOutlineMap className="empty-icon" />
              <p>Vui lòng chọn một tour để tiếp tục</p>
            </div>
          )}

          {selectedTour && !selectedScene && activeTab === 'hotspots' && (
            <div className="empty-state">
              <HiOutlinePhotograph className="empty-icon" />
              <p>Vui lòng chọn một scene để chỉnh sửa hotspots</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
