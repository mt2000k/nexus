import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar({ onSearch, results, onSelectResult, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => onSearch(val.trim()), 300);
    }
  };

  const highlightMatch = (text, q) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-input">
        <FiSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={handleChange}
          className="search-input"
        />
        <button className="search-close" onClick={onClose}><FiX /></button>
      </div>
      {results && results.length > 0 && (
        <div className="search-results">
          {results.map((msg) => (
            <div
              key={msg.id}
              className="search-result-item"
              onClick={() => onSelectResult(msg)}
            >
              <div className="search-result-sender">{msg.senderName}</div>
              <div className="search-result-text">
                {highlightMatch(msg.text, query)}
              </div>
              <div className="search-result-time">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
      {results && results.length === 0 && query.trim().length >= 2 && (
        <div className="search-results">
          <div className="search-no-results">No messages found</div>
        </div>
      )}
    </div>
  );
}
