import { useState } from 'react';
import { 
  HiOutlineMap,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX
} from 'react-icons/hi';

const TourManager = ({ 
  tours, 
  selectedTour, 
  onSelect, 
  onCreate, 
  onUpdate, 
  onDelete,
  scenes 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({ name: '', entry_scene: '' });

  const openCreateModal = () => {
    setEditingTour(null);
    setFormData({ name: '', entry_scene: '' });
    setShowModal(true);
  };

  const openEditModal = (tour) => {
    setEditingTour(tour);
    setFormData({ 
      name: tour.name || '', 
      entry_scene: tour.entry_scene || '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const data = { name: formData.name };
    if (formData.entry_scene) {
      data.entry_scene = formData.entry_scene;
    }

    if (editingTour) {
      await onUpdate(editingTour.id, data);
    } else {
      await onCreate(data);
    }
    setShowModal(false);
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>
          <HiOutlineMap className="header-icon" />
          Quản lý Tours
        </h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus />
          Tạo Tour mới
        </button>
      </div>

      <div className="items-grid">
        {tours.map(tour => (
          <div 
            key={tour.id} 
            className={`item-card ${selectedTour?.id === tour.id ? 'selected' : ''}`}
            onClick={() => onSelect(tour)}
          >
            <div className="item-icon">
              <HiOutlineMap />
            </div>
            <div className="item-info">
              <h3>{tour.name}</h3>
              <p className="item-id">ID: {tour.id}</p>
              {tour.entry_scene && (
                <p className="item-meta">Entry: {tour.entry_scene}</p>
              )}
            </div>
            <div className="item-actions">
              <button 
                className="btn btn-icon btn-edit"
                onClick={(e) => { e.stopPropagation(); openEditModal(tour); }}
                title="Chỉnh sửa"
              >
                <HiOutlinePencil />
              </button>
              <button 
                className="btn btn-icon btn-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(tour.id); }}
                title="Xóa"
              >
                <HiOutlineTrash />
              </button>
            </div>
          </div>
        ))}

        {tours.length === 0 && (
          <div className="empty-state">
            <HiOutlineMap className="empty-icon" />
            <p>Chưa có tour nào. Tạo tour mới để bắt đầu!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTour ? 'Chỉnh sửa Tour' : 'Tạo Tour mới'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Tour *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên tour..."
                  required
                />
              </div>

              {editingTour && scenes.length > 0 && (
                <div className="form-group">
                  <label>Scene khởi đầu</label>
                  <select
                    value={formData.entry_scene}
                    onChange={e => setFormData({ ...formData, entry_scene: e.target.value })}
                  >
                    <option value="">-- Chọn scene --</option>
                    {scenes.map(scene => (
                      <option key={scene.id} value={scene.id}>{scene.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTour ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourManager;
