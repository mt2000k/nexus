import { getFileUrl } from '../utils/api';
import { FiDownload, FiFile, FiImage, FiVideo, FiMusic } from 'react-icons/fi';

function getIcon(fileType) {
  if (fileType?.startsWith('image/')) return <FiImage />;
  if (fileType?.startsWith('video/')) return <FiVideo />;
  if (fileType?.startsWith('audio/')) return <FiMusic />;
  return <FiFile />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FilePreview({ fileUrl, fileName, fileType, fileSize }) {
  const url = getFileUrl(fileUrl);
  const isImage = fileType?.startsWith('image/');
  const isVideo = fileType?.startsWith('video/');
  const isAudio = fileType?.startsWith('audio/');

  if (isImage) {
    return (
      <div className="file-preview-card image-preview">
        <img src={url} alt={fileName} loading="lazy" onClick={() => window.open(url, '_blank')} />
        <div className="file-meta">
          <span className="file-name">{fileName}</span>
          <a href={url} download={fileName} className="file-download"><FiDownload /></a>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="file-preview-card video-preview">
        <video src={url} controls preload="metadata" />
        <div className="file-meta">
          <span className="file-name">{fileName}</span>
          <a href={url} download={fileName} className="file-download"><FiDownload /></a>
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="file-preview-card audio-preview">
        <audio src={url} controls style={{ width: '100%' }} />
        <div className="file-meta">
          <span className="file-name">{fileName}</span>
          <span className="file-size">{formatSize(fileSize)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-preview-card generic-preview">
      <div className="file-icon">{getIcon(fileType)}</div>
      <div className="file-info">
        <span className="file-name">{fileName}</span>
        <span className="file-size">{formatSize(fileSize)}</span>
      </div>
      <a href={url} download={fileName} className="file-download-btn">
        <FiDownload /> Download
      </a>
    </div>
  );
}
