import { useState, useRef, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import VoiceRecorder from './VoiceRecorder';
import { uploadFile } from '../utils/api';
import { FiSmile, FiSend, FiPaperclip, FiX } from 'react-icons/fi';

export default function MessageInput({ onSend, onSendFile, onSendVoice, onStartTyping, onStopTyping, disabled }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    setShowEmoji(false);
    onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [text, onSend, onStopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onStartTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onStopTyping(), 2000);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 25 * 1024 * 1024 * 1024) {
      alert('File size must be under 25GB');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ file, url: e.target.result, type: file.type, name: file.name });
      reader.readAsDataURL(file);
      return;
    }

    await doUpload(file);
  };

  const doUpload = async (file) => {
    setUploading(true);
    try {
      const data = await uploadFile(file);
      onSendFile({
        fileUrl: data.url,
        fileName: data.filename,
        fileType: data.mimetype,
        fileSize: data.size,
        text: '',
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('File upload failed');
    } finally {
      setUploading(false);
      setPreview(null);
    }
  };

  const sendPreview = async () => {
    if (preview?.file) await doUpload(preview.file);
  };

  const handleVoiceSend = async (blob, duration) => {
    setUploading(true);
    try {
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      const data = await uploadFile(file);
      onSendVoice({
        fileUrl: data.url,
        fileName: data.filename,
        fileSize: data.size,
        duration,
      });
    } catch (err) {
      console.error('Voice upload failed:', err);
    } finally {
      setUploading(false);
      setShowVoice(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div
      className={`message-input-container ${dragOver ? 'drag-over' : ''}`}
      style={{ position: 'relative' }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="drag-overlay">
          <FiPaperclip style={{ fontSize: '2rem' }} />
          <span>Drop file to upload</span>
        </div>
      )}

      {preview && (
        <div className="file-upload-preview">
          {preview.type.startsWith('image/') && (
            <img src={preview.url} alt={preview.name} style={{ maxHeight: 120, borderRadius: 8 }} />
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{preview.name}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={sendPreview} disabled={uploading} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              {uploading ? 'Uploading...' : 'Send'}
            </button>
            <button className="btn-secondary" onClick={() => setPreview(null)} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              <FiX />
            </button>
          </div>
        </div>
      )}

      {showEmoji && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" width={320} height={400} searchDisabled={false} skinTonesDisabled previewConfig={{ showPreview: false }} />
        </div>
      )}

      {showVoice ? (
        <div className="message-input-wrapper">
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoice(false)} />
        </div>
      ) : (
        <div className="message-input-wrapper">
          <button className="emoji-btn" onClick={() => setShowEmoji((p) => !p)} disabled={disabled} type="button" title="Emoji">
            <FiSmile />
          </button>
          <button className="emoji-btn" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploading} type="button" title="Attach file">
            <FiPaperclip />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
            accept="image/*,video/*,audio/*,.pdf,.zip,.txt"
          />
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder={disabled ? 'Select a room...' : 'Type a message...'}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
          <button className="emoji-btn" onClick={() => setShowVoice(true)} disabled={disabled} type="button" title="Voice message" style={{ fontSize: '1.1rem' }}>
            🎙️
          </button>
          <button
            className="send-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handleSend();
            }}
            disabled={disabled || !text.trim()}
            title="Send"
            type="button"
          >
            <FiSend />
          </button>
        </div>
      )}
    </div>
  );
}
