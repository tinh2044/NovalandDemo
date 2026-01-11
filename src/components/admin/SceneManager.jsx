import { useState, useRef } from 'react';
import { 
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlineCamera
} from 'react-icons/hi';

const SceneManager = ({
  tourId,
  scenes,
  selectedScene,
  onSelect,
  onCreate,
  onUpdate,
  onDelete
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initial_view: { yaw: 0, pitch: 0, fov: 100 }
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const openCreateModal = () => {
    setEditingScene(null);
    setFormData({
      name: '',
      description: '',
      initial_view: { yaw: 0, pitch: 0, fov: 100 }
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (scene) => {
    setEditingScene(scene);
    setFormData({
      name: scene.name || '',
      description: scene.description || '',
      initial_view: scene.initial_view || { yaw: 0, pitch: 0, fov: 100 }
    });
    setImageFile(null);
    setImagePreview(scene.image_url || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const data = new FormData();
    data.append('tour_id', tourId);
    data.append('name', formData.name);
    data.append('description', formData.description || '');
    data.append('initial_view', JSON.stringify(formData.initial_view));
    
    if (imageFile) {
      data.append('image', imageFile);
    }

    if (editingScene) {
      await onUpdate(editingScene.id, data);
    } else {
      await onCreate(data);
    }
    setShowModal(false);
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>
          <HiOutlinePhotograph className="header-icon" />
          Quản lý Scenes
        </h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus />
          Tạo Scene mới
        </button>
      </div>

      <div className="items-grid scenes-grid">
        {scenes.map(scene => (
          <div
            key={scene.id}
            className={`item-card scene-card ${selectedScene?.id === scene.id ? 'selected' : ''}`}
            onClick={() => onSelect(scene)}
          >
            <div className="scene-thumbnail">
              {scene.image_url ? (
                <img src={scene.image_url} alt={scene.name} />
              ) : (
                <div className="no-image">
                  <HiOutlinePhotograph />
                </div>
              )}
            </div>
            <div className="item-info">
              <h3>{scene.name}</h3>
              <p className="item-description">{scene.description || 'Không có mô tả'}</p>
            </div>
            <div className="item-actions">
              <button
                className="btn btn-icon btn-edit"
                onClick={(e) => { e.stopPropagation(); openEditModal(scene); }}
                title="Chỉnh sửa"
              >
                <HiOutlinePencil />
              </button>
              <button
                className="btn btn-icon btn-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(scene.id); }}
                title="Xóa"
              >
                <HiOutlineTrash />
              </button>
            </div>
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="empty-state">
            <HiOutlinePhotograph className="empty-icon" />
            <p>Chưa có scene nào. Tạo scene mới để bắt đầu!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingScene ? 'Chỉnh sửa Scene' : 'Tạo Scene mới'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-col">
                  <div className="form-group">
                    <label>Tên Scene *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập tên scene..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Nhập mô tả..."
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Góc nhìn ban đầu</label>
                    <div className="view-inputs">
                      <div>
                        <label>Yaw</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.initial_view.yaw}
                          onChange={e => setFormData({
                            ...formData,
                            initial_view: { ...formData.initial_view, yaw: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                      <div>
                        <label>Pitch</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.initial_view.pitch}
                          onChange={e => setFormData({
                            ...formData,
                            initial_view: { ...formData.initial_view, pitch: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                      <div>
                        <label>FOV</label>
                        <input
                          type="number"
                          min="30"
                          max="120"
                          value={formData.initial_view.fov}
                          onChange={e => setFormData({
                            ...formData,
                            initial_view: { ...formData.initial_view, fov: parseInt(e.target.value) || 100 }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-col">
                  <div className="form-group">
                    <label>Ảnh 360°</label>
                    <div className="image-upload">
                      {imagePreview ? (
                        <div className="image-preview">
                          <img src={imagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(editingScene?.image_url || null);
                            }}
                          >
                            <HiOutlineX />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="upload-placeholder"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <HiOutlineCamera className="upload-icon" />
                          <p>Click để tải ảnh lên</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      {imagePreview && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <HiOutlineUpload />
                          Đổi ảnh
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingScene ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneManager;
