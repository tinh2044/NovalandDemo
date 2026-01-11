import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { 
  HiOutlineLocationMarker,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineCursorClick,
  HiOutlinePhotograph
} from 'react-icons/hi';
import { hotspotAPI } from '../../services/api';

const HotspotEditor = ({
  scene,
  allScenes,
  onCreate,
  onUpdate,
  onUpdatePosition,
  onDelete
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);
  const rafRef = useRef(null);

  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedHotspot, setDraggedHotspot] = useState(null);

  // Camera controls
  const isUserInteracting = useRef(false);
  const lon = useRef(0);
  const lat = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const onPointerDownX = useRef(0);
  const onPointerDownY = useRef(0);

  const [formData, setFormData] = useState({
    type: 'click',
    target_scene: '',
    label: '',
    fov_trigger: null
  });

  // Load hotspots
  const loadHotspots = useCallback(async () => {
    try {
      const result = await hotspotAPI.getByScene(scene.id);
      setHotspots(result.items || []);
    } catch (error) {
      console.error('Error loading hotspots:', error);
    }
  }, [scene.id]);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // Sphere
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sphere = new THREE.Mesh(geometry, material);
    threeScene.add(sphere);
    sphereRef.current = sphere;

    // Load texture
    const imageUrl = scene.image_url || scene.image;
    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(imageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        sphere.material.dispose();
        sphere.material = new THREE.MeshBasicMaterial({ map: texture });
      });
    }

    // Set initial view
    if (scene.initial_view) {
      lon.current = (scene.initial_view.yaw || 0) * 180 / Math.PI;
      lat.current = (scene.initial_view.pitch || 0) * 180 / Math.PI;
    }

    // Animation
    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      lat.current = Math.max(-85, Math.min(85, lat.current));
      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
      camera.position.y = 100 * Math.cos(phi);
      camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      renderer.render(threeScene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [scene]);

  // Calculate screen position from 3D position
  const getScreenPosition = useCallback((position) => {
    if (!cameraRef.current || !containerRef.current) return null;

    const camera = cameraRef.current;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const pos3D = new THREE.Vector3(position.x, position.y, position.z);
    
    // Check if in front of camera
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const toHotspot = pos3D.clone().sub(camera.position).normalize();
    if (cameraDir.dot(toHotspot) <= 0) return null;

    const projected = pos3D.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;

    if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return null;

    return { x, y };
  }, []);

  // Convert screen click to 3D position
  const screenTo3D = useCallback((clientX, clientY) => {
    if (!containerRef.current || !cameraRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const camera = cameraRef.current;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const direction = raycaster.ray.direction.clone().normalize();
    const position = direction.multiplyScalar(400);

    return {
      x: Math.round(position.x),
      y: Math.round(position.y),
      z: Math.round(position.z)
    };
  }, []);

  // Mouse handlers for camera control
  const handlePointerDown = useCallback((e) => {
    if (isAddingMode || isDragging) return;
    
    isUserInteracting.current = true;
    onPointerDownX.current = e.clientX;
    onPointerDownY.current = e.clientY;
    onPointerDownLon.current = lon.current;
    onPointerDownLat.current = lat.current;
  }, [isAddingMode, isDragging]);

  const handlePointerMove = useCallback((e) => {
    if (!isUserInteracting.current) return;

    lon.current = (onPointerDownX.current - e.clientX) * 0.1 + onPointerDownLon.current;
    lat.current = (e.clientY - onPointerDownY.current) * 0.1 + onPointerDownLat.current;
  }, []);

  const handlePointerUp = useCallback(() => {
    isUserInteracting.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const camera = cameraRef.current;
    camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.05, 30, 100);
    camera.updateProjectionMatrix();
  }, []);

  // Click to add hotspot
  const handleCanvasClick = useCallback((e) => {
    if (!isAddingMode) return;

    const position = screenTo3D(e.clientX, e.clientY);
    if (!position) return;

    setEditingHotspot(null);
    setFormData({
      type: 'click',
      target_scene: '',
      label: '',
      fov_trigger: null,
      position
    });
    setShowModal(true);
    setIsAddingMode(false);
  }, [isAddingMode, screenTo3D]);

  // Hotspot drag handlers
  const handleHotspotDragStart = useCallback((e, hotspot) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedHotspot(hotspot);
    setSelectedHotspot(hotspot);
  }, []);

  const handleHotspotDrag = useCallback((e) => {
    if (!isDragging || !draggedHotspot) return;

    const position = screenTo3D(e.clientX, e.clientY);
    if (!position) return;

    setHotspots(prev => prev.map(h => 
      h.id === draggedHotspot.id ? { ...h, position } : h
    ));
  }, [isDragging, draggedHotspot, screenTo3D]);

  const handleHotspotDragEnd = useCallback(async (e) => {
    if (!isDragging || !draggedHotspot) return;

    const position = screenTo3D(e.clientX, e.clientY);
    if (position) {
      await onUpdatePosition(draggedHotspot.id, position);
    }

    setIsDragging(false);
    setDraggedHotspot(null);
  }, [isDragging, draggedHotspot, screenTo3D, onUpdatePosition]);

  // Edit hotspot
  const openEditModal = (hotspot) => {
    setEditingHotspot(hotspot);
    setFormData({
      type: hotspot.type || 'click',
      target_scene: hotspot.target_scene || '',
      label: hotspot.label || '',
      fov_trigger: hotspot.fov_trigger || null,
      position: hotspot.position
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      scene_id: scene.id,
      type: formData.type,
      position: formData.position,
      target_scene: formData.target_scene || null,
      label: formData.label || '',
      fov_trigger: formData.type === 'zoom' ? (formData.fov_trigger || 40) : null
    };

    let success;
    if (editingHotspot) {
      success = await onUpdate(editingHotspot.id, data);
    } else {
      success = await onCreate(data);
    }

    if (success) {
      setShowModal(false);
      loadHotspots();
    }
  };

  // Delete hotspot
  const handleDelete = async (hotspotId) => {
    if (!confirm('Xác nhận xóa hotspot này?')) return;
    const success = await onDelete(hotspotId);
    if (success) {
      loadHotspots();
      setSelectedHotspot(null);
    }
  };

  // Update hotspot positions on camera move
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Filter out current scene from target options
  const targetSceneOptions = allScenes.filter(s => s.id !== scene.id);

  return (
    <div className="hotspot-editor">
      <div className="editor-toolbar">
        <h2>
          <HiOutlineLocationMarker className="header-icon" />
          Chỉnh sửa Hotspots - {scene.name}
        </h2>
        <div className="toolbar-actions">
          <button
            className={`btn ${isAddingMode ? 'btn-warning' : 'btn-primary'}`}
            onClick={() => setIsAddingMode(!isAddingMode)}
          >
            {isAddingMode ? (
              <>
                <HiOutlineX />
                Hủy thêm
              </>
            ) : (
              <>
                <HiOutlinePlus />
                Thêm Hotspot
              </>
            )}
          </button>
        </div>
      </div>

      {isAddingMode && (
        <div className="adding-hint">
          <HiOutlineCursorClick />
          Click vào vị trí trên ảnh panorama để đặt hotspot
        </div>
      )}

      <div className="editor-content">
        {/* Panorama Canvas */}
        <div 
          ref={containerRef}
          className="panorama-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={(e) => {
            handlePointerMove(e);
            handleHotspotDrag(e);
          }}
          onPointerUp={(e) => {
            handlePointerUp();
            handleHotspotDragEnd(e);
          }}
          onPointerLeave={(e) => {
            handlePointerUp();
            handleHotspotDragEnd(e);
          }}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          {/* Hotspot markers */}
          {hotspots.map(hotspot => {
            const screenPos = getScreenPosition(hotspot.position);
            if (!screenPos) return null;

            const isSelected = selectedHotspot?.id === hotspot.id;
            const isBeingDragged = draggedHotspot?.id === hotspot.id;

            return (
              <div
                key={hotspot.id}
                className={`editor-hotspot ${isSelected ? 'selected' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                style={{
                  left: screenPos.x,
                  top: screenPos.y,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onPointerDown={(e) => handleHotspotDragStart(e, hotspot)}
                onClick={(e) => {
                  if (!isAddingMode && !isDragging) {
                    e.stopPropagation();
                    setSelectedHotspot(hotspot);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  openEditModal(hotspot);
                }}
              >
                <div className="hotspot-marker">
                  {hotspot.type === 'zoom' ? <HiOutlineSearch /> : <HiOutlineLocationMarker />}
                </div>
                {hotspot.label && (
                  <div className="hotspot-label">{hotspot.label}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hotspot List */}
        <div className="hotspot-list">
          <h3>Danh sách Hotspots ({hotspots.length})</h3>
          <div className="hotspot-items">
            {hotspots.map(hotspot => {
              const targetScene = allScenes.find(s => s.id === hotspot.target_scene);
              return (
                <div
                  key={hotspot.id}
                  className={`hotspot-item ${selectedHotspot?.id === hotspot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedHotspot(hotspot)}
                >
                  <div className="hotspot-item-icon">
                    {hotspot.type === 'zoom' ? <HiOutlineSearch /> : <HiOutlineLocationMarker />}
                  </div>
                  <div className="hotspot-item-info">
                    <strong>{hotspot.label || 'Không có tên'}</strong>
                    {/* <span>{targetScene?.name || 'Chưa chọn'}</span> */}
                    {/* <small>
                      x:{hotspot.position?.x} y:{hotspot.position?.y} z:{hotspot.position?.z}
                    </small> */}
                  </div>
                  <div className="hotspot-item-actions">
                    <button
                      className="btn btn-icon-sm btn-edit"
                      onClick={(e) => { e.stopPropagation(); openEditModal(hotspot); }}
                      title="Chỉnh sửa"
                    >
                      <HiOutlinePencil />
                    </button>
                    <button
                      className="btn btn-icon-sm btn-delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(hotspot.id); }}
                      title="Xóa"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              );
            })}

            {hotspots.length === 0 && (
              <div className="empty-list">
                <HiOutlineLocationMarker className="empty-icon-sm" />
                <p>Chưa có hotspot nào</p>
                <p>Click "Thêm Hotspot" để bắt đầu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingHotspot ? 'Chỉnh sửa Hotspot' : 'Tạo Hotspot mới'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Loại Hotspot</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="click">Click (Nhấn để chuyển)</option>
                  {/* <option value="zoom">Zoom (Zoom để chuyển)</option> */}
                </select>
              </div>

              <div className="form-group">
                <label>Đến Scene *</label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {targetSceneOptions.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-slate-400 text-sm">
                      Không có scene nào để chọn
                    </div>
                  ) : (
                    targetSceneOptions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, target_scene: s.id })}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          formData.target_scene === s.id
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="w-full h-24 rounded overflow-hidden bg-slate-100">
                          {s.image_url ? (
                            <img 
                              src={s.image_url} 
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <HiOutlinePhotograph className="text-3xl" />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium text-center ${
                          formData.target_scene === s.id ? 'text-blue-600' : 'text-slate-700'
                        }`}>
                          {s.name}
                        </span>
                        {formData.target_scene === s.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
                {!formData.target_scene && (
                  <small className="text-red-500 text-xs mt-1 block">Vui lòng chọn một scene</small>
                )}
              </div>

              <div className="form-group">
                <label>Nhãn hiển thị</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ví dụ: Đi vào sảnh..."
                />
              </div>

              {formData.type === 'zoom' && (
                <div className="form-group">
                  <label>FOV Trigger (Zoom bao nhiêu để chuyển)</label>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={formData.fov_trigger || 40}
                    onChange={e => setFormData({ ...formData, fov_trigger: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Vị trí 3D</label>
                <div className="position-display">
                  <span>X: {formData.position?.x}</span>
                  <span>Y: {formData.position?.y}</span>
                  <span>Z: {formData.position?.z}</span>
                </div>
                <small className="form-hint">Kéo thả hotspot trên panorama để thay đổi vị trí</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHotspot ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotEditor;
