import { useState, useEffect, useRef } from 'react';
import { searchRoutes } from './ekomobilApi';

const InputComponent = ({ onAddBus, onReset }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const cleanVal = inputValue.trim();
    if (cleanVal.length < 2) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchRoutes(cleanVal);
        if (isMounted) {
          setSuggestions(results);
          setShowDropdown(results.length > 0);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [inputValue]);

  const handleChange = (event) => {
    const value = event.target.value.toUpperCase();
    setInputValue(value);
  };

  const handleSelectSuggestion = (item) => {
    // If item has id (e.g. "490"), use that
    const lineCode = item.id || item.value.split('-')[0].trim();
    setInputValue(lineCode);
    setShowDropdown(false);
  };

  const handleAdd = (type) => {
    const code = inputValue.trim().replace(/\s+/g, '');
    if (!code) return;

    const rota = type === 'gidiş' ? 0 : 1;
    onAddBus(code, rota);
    setInputValue('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleResetClick = () => {
    if (window.confirm('Tüm kayıtlı hatlar ve harita tercihleri sıfırlanacak. Onaylıyor musunuz?')) {
      onReset();
    }
  };

  return (
    <div className="inputDiv" ref={containerRef} style={{ position: 'relative' }}>
      <h1>Otobüs Ekle!</h1>
      <div style={{ position: 'relative', width: '280px', margin: '0 auto' }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="Hat No (Örn: 490, 200, 65T)"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />

        {isSearching && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              color: '#888',
            }}
          >
            Aranıyor...
          </span>
        )}

        {showDropdown && suggestions.length > 0 && (
          <ul
            className="suggestions-list"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              listStyle: 'none',
              padding: 0,
              margin: '4px 0 0 0',
              maxHeight: '180px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              textAlign: 'left',
              fontFamily: 'sans-serif',
              fontSize: '13px',
            }}
          >
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <strong>{item.id}</strong> - {item.label || item.value}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ gap: '15px', display: 'flex', marginTop: '14px' }}>
        <button className="button-30" onClick={() => handleAdd('gidiş')}>
          Gidiş
        </button>
        <button className="button-30" onClick={() => handleAdd('dönüş')}>
          Dönüş
        </button>
        <button className="button-30" onClick={handleResetClick} style={{ color: '#b60000' }}>
          Sıfırla
        </button>
      </div>
    </div>
  );
};

export default InputComponent;
