import { useCallback, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AboutBus from './AboutBus';
import { goldIcon, redIcon, busIcon } from './markers';
import { fetchBusesOnRoute, fetchRouteCoordinates, fetchRouteDirections } from './ekomobilApi';

const DEFAULT_CENTER = [40.7654, 29.9408]; // Kocaeli

const FitBounds = ({ bounds, lock }) => {
  const map = useMap();
  useEffect(() => {
    if (!lock && bounds && bounds.length > 1) {
      try {
        map.fitBounds(bounds, { padding: [25, 25] });
      } catch (err) {
        console.warn('fitBounds error:', err);
      }
    }
  }, [bounds, lock, map]);
  return null;
};

const MapEventHandler = ({ onMoveEnd }) => {
  useMapEvent('movestart', onMoveEnd);
  return null;
};

const MapComponent = ({ id, code, rota, isFirst, isLast, onRemove, onMoveUp, onMoveDown }) => {
  const [buses, setBuses] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [directionTitle, setDirectionTitle] = useState('');
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [lockMap, setLockMap] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const routeKey = `${code}${rota === 0 ? '+' : '-'}`;
  const [isVisible, setIsVisible] = useState(() => {
    const savedVisible = localStorage.getItem('visible') || '';
    return savedVisible.split(',').map((s) => s.trim()).includes(routeKey);
  });

  const mapRef = useRef(null);

  const getHeaderTitle = () => {
    return rota === 0 ? `${code} Gidiş` : `${code} Dönüş`;
  };

  // Fetch route direction name (e.g. "MUALLİMKÖY > GEBZE > GTÜ")
  useEffect(() => {
    let isMounted = true;
    fetchRouteDirections(code)
      .then((dirs) => {
        if (isMounted) {
          setDirectionTitle(rota === 0 ? dirs.direct0 : dirs.direct1);
        }
      })
      .catch((err) => console.warn('Direction fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, [code, rota]);

  // Fetch route polyline coordinates
  useEffect(() => {
    let isMounted = true;
    fetchRouteCoordinates(code, rota)
      .then((coords) => {
        if (isMounted && coords.length > 0) {
          setRouteCoords(coords);
        }
      })
      .catch((err) => console.warn('Route coordinates fetch error:', err));

    return () => {
      isMounted = false;
    };
  }, [code, rota]);

  // Poll buses live location
  const loadBuses = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingBuses(true);
      }

      try {
        const busList = await fetchBusesOnRoute(code, rota);
        setBuses(busList);
        setFetchError(null);
      } catch (err) {
        console.error(`Error fetching buses for ${code}:`, err);
        setFetchError(err.message || 'Konum alınamadı');
      } finally {
        setIsLoadingBuses(false);
        if (isManualRefresh) {
          setTimeout(() => setIsRefreshing(false), 800);
        }
      }
    },
    [code, rota]
  );

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      if (!isMounted) return;
      await loadBuses(false);
    };

    runFetch();

    // Poll every 6 seconds
    const intervalId = setInterval(runFetch, 6000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [loadBuses]);

  const handleManualRefresh = () => {
    if (isRefreshing) return;
    loadBuses(true);
  };

  const toggleVisibility = () => {
    const nextState = !isVisible;
    setIsVisible(nextState);

    const savedVisible = (localStorage.getItem('visible') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let updatedVisible;
    if (nextState) {
      updatedVisible = Array.from(new Set([...savedVisible, routeKey]));
    } else {
      updatedVisible = savedVisible.filter((k) => k !== routeKey);
    }
    localStorage.setItem('visible', updatedVisible.join(','));

    if (nextState) {
      setTimeout(() => {
        const map = mapRef.current;
        if (map) {
          map.invalidateSize();
          if (routeCoords.length > 1) {
            map.fitBounds([routeCoords[0], routeCoords[routeCoords.length - 1]]);
          }
        }
      }, 250);
    }
  };

  const initialBounds =
    routeCoords.length > 1
      ? [routeCoords[0], routeCoords[routeCoords.length - 1]]
      : buses.length > 0
      ? [buses[0].position, buses[0].position]
      : null;

  return (
    <div className="mapClass" id={`map-${id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px' }}>
        <h2 style={{ margin: 'auto', fontSize: '1.25rem' }}>{getHeaderTitle()}</h2>
        <button
          className="button-30 toggle-btn"
          onClick={toggleVisibility}
          style={{ marginLeft: 'auto', fontSize: '13px', height: '28px' }}
        >
          {isVisible ? 'Gizle' : 'Göster'}
        </button>
      </div>

      {directionTitle && (
        <h3 style={{ padding: '0 8px', color: '#333', fontSize: '0.85rem' }}>{directionTitle}</h3>
      )}

      {/* Offline notice when visible and no buses */}
      {buses.length === 0 && (
        <div className="overlay-text" style={{ margin: '6px auto', width: '90%', padding: '6px', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {isLoadingBuses ? 'Otobüsler Aranıyor...' : 'Otobüs Çevrimdışı / Seferde Araç Yok'}
          </p>
          {fetchError && <p style={{ fontSize: '75%', margin: '4px 0 0' }}>{fetchError}</p>}
        </div>
      )}

      {isVisible && (
        <div className="mapContent" id={`mapContent-${id}`} style={{ display: 'block' }}>
          <div style={{ height: '360px', width: '100%', position: 'relative' }}>
            <MapContainer
              ref={mapRef}
              center={buses[0]?.position || routeCoords[0] || DEFAULT_CENTER}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              attributionControl={false}
            >
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Live bus markers with plate numbers */}
              {buses.map((bus, bIdx) => (
                <Marker key={`bus-${bIdx}`} position={bus.position} icon={busIcon}>
                  <Tooltip direction="top" offset={[0, -25]} opacity={0.95} permanent>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
                      {bus.plate || `${code} Otobüs`}
                    </span>
                  </Tooltip>
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
                      <strong>Hat:</strong> {code} ({rota === 0 ? 'Gidiş' : 'Dönüş'})<br />
                      <strong>Plaka:</strong> {bus.plate || 'Bilinmiyor'}<br />
                      <strong>Konum:</strong> {bus.lat.toFixed(5)}, {bus.lng.toFixed(5)}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Route polyline and start / end endpoints */}
              {routeCoords.length > 0 && (
                <>
                  <Polyline
                    positions={routeCoords}
                    color="#2b6cb0"
                    weight={4}
                    opacity={0.75}
                    dashArray="4, 6"
                    lineCap="round"
                  />
                  <Marker position={routeCoords[0]} icon={goldIcon}>
                    <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
                      <p
                        style={{
                          color: '#b7791f',
                          fontWeight: 'bold',
                          fontSize: '120%',
                          fontFamily: 'Russo One',
                          margin: 0,
                        }}
                      >
                        Başlangıç
                      </p>
                    </Tooltip>
                  </Marker>
                  <Marker position={routeCoords[routeCoords.length - 1]} icon={redIcon}>
                    <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
                      <p
                        style={{
                          color: '#c53030',
                          fontWeight: 'bold',
                          fontSize: '120%',
                          fontFamily: 'Russo One',
                          margin: 0,
                        }}
                      >
                        Bitiş
                      </p>
                    </Tooltip>
                  </Marker>
                </>
              )}

              <MapEventHandler onMoveEnd={() => setLockMap(true)} />
              {initialBounds && <FitBounds bounds={initialBounds} lock={lockMap} />}
            </MapContainer>
          </div>

          <div className="mapButtons">
            <button
              className="move-btn move-up"
              onClick={onMoveUp}
              disabled={isFirst}
              style={{ opacity: isFirst ? 0.35 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
              title="Yukarı Taşı"
            >
              ↑
            </button>
            <button
              className="mapButtonRefresh button-30"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
            </button>
            <button className="mapButtonRemove button-30" onClick={onRemove}>
              Kaldır
            </button>
            <button
              className="mapButtonInfo button-30"
              onClick={() => setShowInfo((prev) => !prev)}
            >
              {showInfo ? 'Kapat' : 'Hat Bilgisi'}
            </button>
            <button
              className="move-btn move-down"
              onClick={onMoveDown}
              disabled={isLast}
              style={{ opacity: isLast ? 0.35 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
              title="Aşağı Taşı"
            >
              ↓
            </button>
          </div>

          <AboutBus busCode={code} busRota={rota} isVisible={showInfo} />
        </div>
      )}
    </div>
  );
};

export default MapComponent;