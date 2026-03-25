import { useState } from 'react';

export default function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), type);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create New Room</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="room-name">Room Name</label>
            <input
              id="room-name"
              className="form-input"
              type="text"
              placeholder="e.g. design-team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="room-desc">Description (optional)</label>
            <input
              id="room-desc"
              className="form-input"
              type="text"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Room Type</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <input type="radio" name="type" value="public" checked={type === 'public'} onChange={(e) => setType(e.target.value)} />
                Public
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <input type="radio" name="type" value="private" checked={type === 'private'} onChange={(e) => setType(e.target.value)} />
                Private
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Create Room</button>
          </div>
        </form>
      </div>
    </div>
  );
}
