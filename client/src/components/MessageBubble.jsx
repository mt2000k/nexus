import { useState } from 'react';
import FilePreview from './FilePreview';
import ReactionPicker, { ReactionBar } from './ReactionPicker';
import { FiSmile, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { getFileUrl } from '../utils/api';

export default function MessageBubble({ message, isSent, reactions, currentUserId, onReaction, onCallUser }) {
  const [showReactions, setShowReactions] = useState(false);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderStatus = () => {
    if (!isSent) return null;
    const s = message.status;
    if (s === 'read') return <span className="read-receipt read" title="Read">✓✓</span>;
    if (s === 'delivered') return <span className="read-receipt delivered" title="Delivered">✓✓</span>;
    return <span className="read-receipt sent" title="Sent">✓</span>;
  };

  const renderContent = () => {
    if (message.type === 'file') {
      return (
        <>
          <FilePreview
            fileUrl={message.fileUrl}
            fileName={message.fileName}
            fileType={message.fileType}
            fileSize={message.fileSize}
          />
          {message.text && <span className="message-text">{message.text}</span>}
        </>
      );
    }

    if (message.type === 'voice') {
      return (
        <div className="voice-message-player">
          <audio src={getFileUrl(message.fileUrl)} controls preload="metadata" />
        </div>
      );
    }

    return <span className="message-text">{message.text || '[Empty]'}</span>;
  };

  return (
    <div
      className={`message-wrapper ${isSent ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowReactions(false)}
    >
      {!isSent && (
        <div className="user-avatar small">
          {message.avatar || message.senderName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <div className="message-content-wrap">
        <div className="message-bubble">
          {!isSent && (
            <span 
              className="message-sender" 
              onClick={() => onCallUser?.({ id: message.senderId, username: message.senderName }, 'video')}
              style={{ cursor: 'pointer' }}
              title={`Call ${message.senderName}`}
            >
              {message.senderName}
            </span>
          )}
          {renderContent()}
          <span className="message-time">
            {time} {renderStatus()}
          </span>
          <button
            className="reaction-trigger"
            onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
            title="React"
          >
            <FiSmile />
          </button>
          {showReactions && (
            <ReactionPicker
              onSelect={(emoji) => onReaction?.(message.id, emoji)}
              onClose={() => setShowReactions(false)}
            />
          )}
        </div>
        <ReactionBar
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={(emoji) => onReaction?.(message.id, emoji)}
        />
      </div>
    </div>
  );
}
