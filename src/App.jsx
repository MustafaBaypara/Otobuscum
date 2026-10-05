import { useState, useEffect } from 'react';
import MapComponent from './map.jsx';
import InputComponent from './addBus.jsx';
import './App.css';

const DEFAULT_ROUTES = '%%490+%%490-%%305+%%305-';

const parseSavedData = (dataStr) => {
  if (!dataStr) return [];
  const entries = dataStr.split('%%').filter(Boolean);
  return entries.map((title) => {
    const isGidis = title.includes('+');
    const code = title.replace(/[+-]/g, '').trim();
    const rota = isGidis ? 0 : 1;
    return {
      id: `${code}${rota === 0 ? '+' : '-'}`,
      code,
      rota,
      title,
    };
  });
};

const App = () => {
  const [localData, setLocalData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    let saved = localStorage.getItem('savedData');
    if (!saved) {
      saved = DEFAULT_ROUTES;
      localStorage.setItem('savedData', DEFAULT_ROUTES);
    }

    const parsed = parseSavedData(saved);
    setLocalData(parsed);

    if (!localStorage.getItem('visible')) {
      const visibleData = parsed.map((item) => item.title);
      localStorage.setItem('visible', visibleData.join(','));
    }
    setIsLoaded(true);
  }, []);

  // Sync state to localStorage whenever localData changes
  useEffect(() => {
    if (!isLoaded) return;
    if (localData.length === 0) {
      localStorage.setItem('savedData', '');
      return;
    }
    const dataString = '%%' + localData.map((item) => item.title).join('%%');
    localStorage.setItem('savedData', dataString);
  }, [localData, isLoaded]);

  const handleAddBus = (code, rota) => {
    const title = `${code}${rota === 0 ? '+' : '-'}`;
    if (localData.some((item) => item.title === title)) {
      alert(`${code} (${rota === 0 ? 'Gidiş' : 'Dönüş'}) zaten ekli!`);
      return;
    }

    const newItem = {
      id: title,
      code,
      rota,
      title,
    };

    setLocalData((prev) => [...prev, newItem]);

    // Also make the newly added bus visible by default
    const savedVisible = (localStorage.getItem('visible') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!savedVisible.includes(title)) {
      savedVisible.push(title);
      localStorage.setItem('visible', savedVisible.join(','));
    }
  };

  const handleRemoveBus = (indexToRemove) => {
    const itemToRemove = localData[indexToRemove];
    setLocalData((prev) => prev.filter((_, idx) => idx !== indexToRemove));

    // Remove from visible list if present
    if (itemToRemove) {
      const savedVisible = (localStorage.getItem('visible') || '')
        .split(',')
        .map((s) => s.trim())
        .filter((k) => k !== itemToRemove.title);
      localStorage.setItem('visible', savedVisible.join(','));
    }
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setLocalData((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= localData.length - 1) return;
    setLocalData((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleReset = () => {
    const parsedDefault = parseSavedData(DEFAULT_ROUTES);
    setLocalData(parsedDefault);
    localStorage.setItem('savedData', DEFAULT_ROUTES);
    const visibleData = parsedDefault.map((item) => item.title);
    localStorage.setItem('visible', visibleData.join(','));
  };

  return (
    <>
      <InputComponent onAddBus={handleAddBus} onReset={handleReset} />
      <div className="mainMap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {localData.length === 0 ? (
          <div style={{ padding: '30px', color: '#666', textAlign: 'center' }}>
            <p>Kayıtlı otobüs hattı yok. Yukarıdan hat ekleyebilirsiniz.</p>
          </div>
        ) : (
          localData.map((item, index) => (
            <div key={item.id} className="map-container">
              <MapComponent
                id={item.id}
                code={item.code}
                rota={item.rota}
                index={index}
                isFirst={index === 0}
                isLast={index === localData.length - 1}
                onRemove={() => handleRemoveBus(index)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
            </div>
          ))
        )}

        <a href="https://github.com/MustafaBaypara/Otobuscum" target="_blank" rel="noopener noreferrer">
          <img
            style={{ marginTop: '5%' }}
            align="center"
            alt="Otobuscum GitHub Repo Stats"
            src="https://github-readme-stats.vercel.app/api/pin/?username=mustafabaypara&repo=otobuscum&show_owner=true&bg_color=151515&text_color=9f9f9f&icon_color=fff&title_color=fff"
          />
        </a>
      </div>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');`}
      </style>
    </>
  );
};

export default App;
