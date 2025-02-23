import React, { useCallback, useEffect, useState, useRef} from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import BusData from './AboutBus';
import { goldIcon, redIcon, busIcon } from './markers';

const MapComponent = (props) => {
  const [busData, setBusData] = useState([]);
  const [stationData, setStationData] = useState([]);
  const [busCoor, setBusCoor] = useState([[0, 0]]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lockMap, setLockMap] = useState(false);
  const [isShow, setIsShow] = useState(localStorage.getItem('visible').split(',').includes(props.code + (props.rota === 0 ? '+' : '-')) ? 'block' : 'none');

  let timeCounter = 0;
  let stationCounter = 2000;
  let polylineCounter = 2000;
  const mapRef = useRef();

  const HeaderMap = () => {
    return props.rota === 0 ? `${props.code} Gidiş` : `${props.code} Dönüş`;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const InfoFunc = (id) => {
    const element = document.getElementsByClassName('BusData')[id];
    if (element) {
      element.style.display = element.style.display === 'block' ? 'none' : 'block';
    }
  };

  const removeMap = () => {
    const element = document.getElementById(props.id);
    if (element && element.className === 'mapClass') {
      const rotaSymbol = props.rota === 0 ? '+' : '-';
      const updatedData = localStorage.getItem('savedData').replace(`%%${props.code}${rotaSymbol}`, '');
      localStorage.setItem('savedData', updatedData);
      element.remove();
    }
  };

// Yukarı taşıma fonksiyonu
const moveUp = () => {
  const currentElement = document.getElementById(props.id);
  if (!currentElement) {
    console.log("Current element bulunamadı:", props.id);
    return;
  }

  const parent = currentElement.parentElement.parentElement; // map-container'ın parent'ına ulaş
  const currentContainer = currentElement.parentElement; // Mevcut map-container
  const previousContainer = currentContainer.previousElementSibling;

  if (!previousContainer || !previousContainer.querySelector('.mapClass')) {
    console.log("Önceki eleman yok veya mapClass değil");
    return;
  }

  // HTML'de yer değiştirme (map-container seviyesinde)
  parent.insertBefore(currentContainer, previousContainer);

  // localStorage'da yer değiştirme
  const rotaSymbol = props.rota === 0 ? '+' : '-';
  const currentItem = `${props.code}${rotaSymbol}`;
  let savedData = localStorage.getItem('savedData');
  const dataArray = savedData.split('%%').filter(Boolean); // Boş elemanları temizle
  const currentIndex = dataArray.indexOf(currentItem);

  if (currentIndex === 0) return; // İlk eleman zaten en üstteyse çık

  // Dizide yer değiştirme
  [dataArray[currentIndex - 1], dataArray[currentIndex]] = [
    dataArray[currentIndex],
    dataArray[currentIndex - 1],
  ];

  // Güncellenmiş veriyi localStorage'a kaydet
  localStorage.setItem('savedData', '%%' + dataArray.join('%%'));
};

// Aşağı taşıma fonksiyonu
const moveDown = () => {
  const currentElement = document.getElementById(props.id);
  if (!currentElement) {
    console.log("Current element bulunamadı:", props.id);
    return;
  }

  const parent = currentElement.parentElement.parentElement; // map-container'ın parent'ına ulaş
  const currentContainer = currentElement.parentElement; // Mevcut map-container
  const nextContainer = currentContainer.nextElementSibling;

  if (!nextContainer || !nextContainer.querySelector('.mapClass')) {
    console.log("Sonraki eleman yok veya mapClass değil");
    return;
  }

  // HTML'de yer değiştirme (map-container seviyesinde)
  parent.insertBefore(nextContainer, currentContainer);

  // localStorage'da yer değiştirme
  const rotaSymbol = props.rota === 0 ? '+' : '-';
  const currentItem = `${props.code}${rotaSymbol}`;
  let savedData = localStorage.getItem('savedData');
  const dataArray = savedData.split('%%').filter(Boolean); // Boş elemanları temizle
  const currentIndex = dataArray.indexOf(currentItem);

  if (currentIndex === dataArray.length - 1) return; // Son eleman zaten en alttaysa çık

  // Dizide yer değiştirme
  [dataArray[currentIndex], dataArray[currentIndex + 1]] = [
    dataArray[currentIndex + 1],
    dataArray[currentIndex],
  ];

  // Güncellenmiş veriyi localStorage'a kaydet
  localStorage.setItem('savedData', '%%' + dataArray.join('%%'));
};

  const fetchData = useCallback(async (code) => {
    try {
      const response = await fetch(
        `https://e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchBusesontheRoute&route_code=${props.code}&direction=${props.rota}`
      );
      if (!response.ok) throw new Error('Veri alınamadı');
      const textData = await response.text();
      const parser = new DOMParser();
      const html = parser.parseFromString(textData, 'text/html');
      const data = Array.from(html.querySelectorAll('li input')).map((input) =>
        input.value.split('+').map(parseFloat)
      );

      if (code === 0) {
        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), 1000);
        if (data.length === 0) return;
        timeCounter = 0;
        setBusData(data);
        return;
      }

      if (data.length === 0) {
        timeCounter += 5000;
        await wait(5000 + timeCounter);
        fetchData();
      } else {
        timeCounter = 0;
        setBusData(data);
        await wait(5000);
        fetchData();
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  }, [props.code, props.rota]);

  const polylinePositions = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteCoordPoint&route_code=${props.code}&direction=${props.rota}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `cmd=searchRouteCoordPoints&route_code=${props.code}&direction=${props.rota}`,
        }
      );

      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      if (result.length === 0) {
        polylineCounter *= 2;
        await wait(1000 + polylineCounter);
        polylinePositions();
        return;
      }
      const resultArray = result.map((item) => [parseFloat(item.Latitude), parseFloat(item.Longitude)]);
      setBusCoor(resultArray);
    } catch (error) {
      console.log(error.message);
    }
  }, [props.code, props.rota]);

  const stationFunc = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteDirections&route_code=${props.code}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `route_code=${props.code}`,
        }
      );

      if (!response.ok) throw new Error('Network response was not ok');
      let result = await response.json();
      if (result.length === 0 || result['direct0'] === 'Gidiş Yönü') {
        stationCounter *= 2;
        await wait(1000 + stationCounter);
        stationFunc();
        return;
      }
      stationCounter = 0;
      result = JSON.stringify(result).replace(/-/g, '>');
      result = JSON.parse(result);
      setStationData(result[`direct${props.rota}`]);
    } catch (error) {
      console.log(error.message);
    }
  }, [props.code, props.rota]);

  useEffect(() => {
    fetchData();
    polylinePositions();
    stationFunc();
  }, [fetchData, polylinePositions, stationFunc]);

  const handleRefreshClick = () => {
    setIsButtonDisabled(true);
    fetchData(0);
    setTimeout(() => setIsButtonDisabled(false), 3000);
  };

  const MapEventHandler = ({ onMoveEnd }) => {
    useMapEvent('movestart', onMoveEnd);
    return null;
  };

  const FitBounds = ({ bounds, lock }) => {
    const map = useMap();
    if (!lock) map.fitBounds(bounds);
    return null;
  };

  const handleMoveEnd = () => {
    setLockMap(true);
  };

  const toggleVisibility = () => {
    var visible = localStorage.getItem('visible').split(',');
    visible = visible.map((item) => item.trim());
  
    const newVisibility = isShow === 'block' ? 'none' : 'block';
    setIsShow(newVisibility);
  
    if (newVisibility === 'block') {
      if (!visible.includes(props.code + (props.rota === 0 ? '+' : '-'))) {
        visible.push(props.code + (props.rota === 0 ? '+' : '-'));
        localStorage.setItem('visible', visible);
      }
  
      setTimeout(() => {
        const map = mapRef.current;
        if (map) {
          map.invalidateSize();
          if (busCoor.length > 0) {
            map.fitBounds([busCoor[0], busCoor[busCoor.length - 1]]);
          }
        }
      }, 300); // Harita görünür hale geldikten sonra zaman tanımak için
    } else {
      if (visible.includes(props.code + (props.rota === 0 ? '+' : '-'))) {
        visible = visible.filter((item) => item !== props.code + (props.rota === 0 ? '+' : '-'));
        localStorage.setItem('visible', visible);
      }
    }
  };
  
  if (busData.length === 0) {
    return (
      <div className="mapClass" id={props.id} >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{margin: 'auto'}} >{HeaderMap()}</h2>
        <button className="toggle-btn" onClick={toggleVisibility} style={{margin: '10px', marginLeft: 'auto'}}>
          {isShow === 'none' ? 'Göster' : 'Gizle'}
        </button>
        </div>
        <h3>{stationData}</h3>
        <div className="overlay-text">
          <p>Otobüs Çevrimdışı</p>
        </div>
        <div className="mapContent" id={props.id + "mapContent"} style={{ display: isShow}}>
        <MapContainer ref={mapRef} style={{ height: '100px', width: '400px', zIndex: '0' }} attributionControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={busData[0] || [0, 0]}></Marker>
        {busCoor.length > 1 && <FitBounds bounds={[busCoor[0], busCoor[busCoor.length - 1]]} lock={lockMap} />}
        </MapContainer>
        <div className="mapButtons" >
          <button className="move-btn move-up" onClick={moveUp}>↑</button>
          <button className="mapButtonRefresh button-30" onClick={handleRefreshClick} disabled={isButtonDisabled}>
            Yenile
          </button>
          <button className="mapButtonRemove button-30" onClick={removeMap}>
            Kaldır
          </button>
          <button className="mapButtonInfo button-30" onClick={() => InfoFunc(props.id - 1)}>
            Hat Bilgisi
          </button>
          <button className="move-btn move-down" onClick={moveDown}>↓</button>
        </div>
        <BusData busCode={props.code} busRota={props.rota} />
      </div>
      </div>
    );
  }

  if (busData.length === 1) {
    return (
      <div className="mapClass" id={props.id}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{margin: 'auto'}} >{HeaderMap()}</h2>
        <button className="toggle-btn" onClick={toggleVisibility} style={{margin: '10px', marginLeft: 'auto'}}>
          {isShow === 'none' ? 'Göster' : 'Gizle'}
        </button>
        </div>
        <h3>{stationData}</h3>
        <div className="mapContent" id={props.id + "mapContent"} style={{ display: isShow}}>
        <MapContainer ref={mapRef} style={{ height: '400px', width: '400px', zIndex: '0' }} attributionControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={busData[0]} icon={busIcon}></Marker>
          <Polyline positions={busCoor} color="black" weight={3} opacity={0.7} dashArray="2, 5" lineCap="round" />
          <Marker position={busCoor[0]} icon={goldIcon}>
            <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
              <p
                style={{
                  color: 'gold',
                  fontWeight: 'lighter',
                  fontSize: '150%',
                  fontFamily: 'Russo One',
                  letterSpacing: '2px',
                  textShadow: '1px 1px 0 #c18103, -1px 1px 0rgb(78, 75, 67)',
                }}
              >
                Başlangıç
              </p>
            </Tooltip>
          </Marker>
          <Marker position={busCoor[busCoor.length - 1]} icon={redIcon}>
            <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
              <p
                style={{
                  color: '#cd3951',
                  fontWeight: 'lighter',
                  fontSize: '150%',
                  fontFamily: 'Russo One',
                  letterSpacing: '2px',
                  textShadow: '1px 1px 0 #aa253b, -1px 1px 0 #aa253b',
                }}
              >
                Bitiş
              </p>
            </Tooltip>
          </Marker>
          <MapEventHandler onMoveEnd={handleMoveEnd} />
          {busCoor.length > 1 && <FitBounds bounds={[busCoor[0], busCoor[busCoor.length - 1]]} lock={lockMap} />}
        </MapContainer>
        <div className="mapButtons">
          <button className="move-btn move-up" onClick={moveUp}>↑</button>
          <button className="mapButtonRefresh button-30" onClick={handleRefreshClick} disabled={isButtonDisabled}>
            Yenile
          </button>
          <button className="mapButtonRemove button-30" onClick={removeMap}>
            Kaldır
          </button>
          <button className="mapButtonInfo button-30" onClick={() => InfoFunc(props.id - 1)}>
            Hat Bilgisi
          </button>
          <button className="move-btn move-down" onClick={moveDown}>↓</button>
        </div>
        <BusData busCode={props.code} busRota={props.rota} />
      </div>
      </div>
    );
  }

  return (
    <div className="mapClass" id={props.id}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{margin: 'auto'}} >{HeaderMap()}</h2>
        <button className="toggle-btn" onClick={toggleVisibility} style={{margin: '10px', marginLeft: 'auto'}}>
          {isShow === 'none' ? 'Göster' : 'Gizle'}
        </button>
        </div>
      <h3>{stationData}</h3>
      <div className="mapContent" id={props.id + "mapContent"} style={{ display: isShow}}>
      <MapContainer ref={mapRef} style={{ height: '400px', width: '400px', zIndex: '0' }} attributionControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {busData.map((position, index) => (
          <Marker key={index} position={position} icon={busIcon}></Marker>
        ))}
        <Marker position={busCoor[0]} icon={goldIcon}>
          <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
            <p
              style={{
                color: 'gold',
                fontWeight: 'lighter',
                fontSize: '150%',
                fontFamily: 'Russo One',
                letterSpacing: '2px',
                textShadow: '1px 1px 0 #c18103, -1px 1px 0 #c18103',
              }}
            >
              Başlangıç
            </p>
          </Tooltip>
        </Marker>
        <Marker position={busCoor[busCoor.length - 1]} icon={redIcon}>
          <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
            <p
              style={{
                color: '#cd3951',
                fontWeight: 'lighter',
                fontSize: '150%',
                fontFamily: 'Russo One',
                letterSpacing: '2px',
                textShadow: '1px 1px 0 #aa253b, -1px 1px 0 #aa253b',
              }}
            >
              Bitiş
            </p>
          </Tooltip>
        </Marker>
        <Polyline positions={busCoor} color="black" weight={3} opacity={0.7} dashArray="2, 5" lineCap="round" />
        <MapEventHandler onMoveEnd={handleMoveEnd} />
        {busCoor.length > 1 && <FitBounds bounds={[busCoor[0], busCoor[busCoor.length - 1]]} lock={lockMap} />}
      </MapContainer>
      <div className="mapButtons">
        <button className="move-btn move-up" onClick={moveUp}>↑</button>
        <button className="mapButtonRefresh button-30" onClick={handleRefreshClick} disabled={isButtonDisabled}>
          Yenile
        </button>
        <button className="mapButtonRemove button-30" onClick={removeMap}>
          Kaldır
        </button>
        <button className="mapButtonInfo button-30" onClick={() => InfoFunc(props.id - 1)}>
          Hat Bilgisi
        </button>
        <button className="move-btn move-down" onClick={moveDown}>↓</button>
      </div>
      <BusData busCode={props.code} busRota={props.rota} />
    </div>
    </div>
  );
};

export default MapComponent;