import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import BusData from './AboutBus';
import { goldIcon, redIcon, busIcon, blackIcon} from './markers';

const MapComponent = (props) => {
  const [busData, setBusData] = useState([]);
  const [ortData, setOrtData] = useState([]);
  const [stationData, setstationData] = useState([]);
  const [busCoor, setBusCoor] = useState([[0, 0]]);
  const [location, setLocation] = useState([[0, 0]]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  var timeCounter = 0;
  var stationCounter = 2000;
  var polylineCounter = 2000;

  const HeaderMap = () => {
  if (props.rota == 0) {
    return (props.code + " Gidiş")
  } else {
    return (props.code + " Dönüş")
  }}

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function InfoFunc(id) {
    let Element = document.getElementsByClassName('BusData')[id];
    if (Element.style.display === 'block') {
      Element.style.display = 'none';
      return;
    }
    Element.style.display = 'block';
  }


  function removeMap(props) {
    const element = document.getElementById(props.id);
    if (element.className === 'mapClass') { 
      let rota;
      if (props.rota == 0) {
        rota = '+';
      } else {
        rota = '-';
      }
      localStorage.setItem('savedData', localStorage.getItem('savedData').replace('%%' + props.code + rota , ''));
    element.remove();
    }
  }

  const fetchData = useCallback(async (code) => {
    try {
      const response = await fetch('https://e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchBusesontheRoute&route_code=' + props.code +'&direction=' + props.rota);
      if (!response.ok) {
        throw new Error('Veri alınamadı');
      }
      const textData = await response.text();
      const parser = new DOMParser();
      const html = parser.parseFromString(textData, 'text/html');
      const data = Array.from(html.querySelectorAll('li input')).map(input => input.value.split('+').map(parseFloat));
      if (code === 0) {
        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), 1000);
        if (data.length === 0) {
          return;
        }
        timeCounter = 0;
        setBusData(data);
        return;
      }
      if (data.length === 0) {
        timeCounter += 5000;
        await wait(5000 + timeCounter);
        fetchData();
      }
      else {
        timeCounter = 0;
        setBusData(data);
        await wait(5000);
        fetchData();
      }
    } catch (error) {
      console.error('Hata:', error);
    }
  });

  const polylinePositions = useCallback(async () => {
    try {
      const response = await fetch('https://www.e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteCoordPoint&route_code=' + props.code +'&direction=' + props.rota, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'cmd=searchRouteCoordPoints&route_code=' + props.code +'&direction=' + props.rota
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      if (result.length === 0) {
        polylineCounter *= 2;
        await wait(1000 + polylineCounter);
        polylinePositions();
        return;
      }
      let resultArray = [];
      result.map((item) => {
        resultArray.push([parseFloat(item.Latitude), parseFloat(item.Longitude)]);
      });
      setBusCoor(resultArray);
    } catch (error) {
      console.log(error.message);
    }
  });

  const stationFunc = useCallback(async () => {
    try {
      const response = await fetch('https://www.e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteDirections&route_code' + props.code, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'route_code=' + props.code
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      let result = await response.json();
      if (result.length === 0 || result["direct" + 0] === "Gidiş Yönü") {
        stationCounter *= 2;
        await wait(1000 + stationCounter);
        stationFunc();
        return;
      }
      stationCounter = 0;
      result = JSON.stringify(result);
      result = result.replace(/-/g, ">");
      result = JSON.parse(result);
      setstationData(result[("direct" + props.rota)]);
    } catch (error) {
      console.log(error.message);
    }
  });

  useEffect(() => {
    fetchData();
    polylinePositions();
    stationFunc();
    }, []);

  useEffect(() => {
    let ortalamaListe = [];
    if (busData.length > 0) {
      for (let i = 0; i < busData.length; i++) {
        const ortalama = busData.reduce((acc, cur) => acc + cur[i], 0) / busData.length;
        ortalamaListe.push(ortalama);
      }
    }
    setOrtData(ortalamaListe);
  }, [busData]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLocation([latitude, longitude]);
      },
      (error) => {
        setLocation([0, 0]);
        console.error('Konum bilgisini alırken bir hata oluştu:', error);
      }
    );
  }, [busData]);

  const handleRefreshClick = () => {
    setIsButtonDisabled(true); 
    fetchData(0);
    setTimeout(() => setIsButtonDisabled(false), 3000);
  };

  if (busData.length === 0 || ortData.length === 0) {
    return (
      <div className='mapClass' id={props.id}>
      <h2>{HeaderMap()}</h2>
      <h3>{stationData}</h3>
      <div className="overlay-text">
        <p>Otobüs Çevrimdışı</p>
      </div>
        <MapContainer center={busData[0]} zoom={13} style={{ height: "400px", width: "400px"}} attributionControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          <Marker position={busData[0]}></Marker>
      </MapContainer>
      <div className='mapButtons'>
      <button className='mapButtonRefresh button-30' onClick={handleRefreshClick} disabled={isButtonDisabled}>Yenile</button>
      <button className='mapButtonRemove button-30' onClick={() => removeMap(props)}>Kaldır</button>
      <button className='mapButtonInfo button-30' onClick={() => InfoFunc(props.id - 1)}>Hat Bilgisi</button>
      </div>
      <BusData busCode = {props.code} busRota = {props.rota}/>
      </div>
    );
  }

  if (busData.length === 1) {
    return (
    <div className='mapClass' id={props.id}>
    <h2>{HeaderMap()}</h2>
    <h3>{stationData}</h3>
      <MapContainer center={(location[0] !== 0 || location[1] !== 0) ? location : busData[0]} zoom={13} style={{ height: "400px", width: "400px"}} attributionControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Marker position={busData[0]} icon={busIcon}></Marker>
        <Polyline positions={busCoor} color="black" op  weight={3} opacity={0.7} dashArray="2, 5" lineCap="round"/>
        <Marker position={busCoor[0]} icon={goldIcon}>
        <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: 'gold', fontWeight: "lighter", fontSize: "150%", transparent: true, fontFamily: "Russo One", letterSpacing: "2px", textShadow: "1px 1px 0 #c18103, -1px 1px 0 #c18103"}}>Başlangıç</p>
            </Tooltip>
        </Marker>
        <Marker position={location} icon={blackIcon}>
        <Tooltip className="tooltipstyle" direction="bottom" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: 'black', fontWeight: "lighter", fontSize: "100%", transparent: true, fontFamily: "Russo One"}}>Buradasın</p>
            </Tooltip>
        </Marker>
        <Marker position={busCoor[busCoor.length - 1]} icon={redIcon}>
        <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: '#cd3951', fontWeight: "lighter", fontSize: "150%", transparent: true, fontFamily: "Russo One", letterSpacing: "2px", textShadow: "1px 1px 0 #aa253b, -1px 1px 0 #aa253b"}}>Bitiş</p>
        </Tooltip>
        </Marker>
    </MapContainer>
    <div className='mapButtons'>
    <button className='mapButtonRefresh button-30' onClick={handleRefreshClick} disabled={isButtonDisabled}>Yenile</button>
    <button className='mapButtonRemove button-30' onClick={() => removeMap(props)}>Kaldır</button>
    <button className='mapButtonInfo button-30' onClick={() => InfoFunc(props.id - 1)}>Hat Bilgisi</button>
    </div>
    <BusData busCode = {props.code} busRota = {props.rota}/>
    </div>
    );
  }

  return (
    <div className='mapClass' id={props.id}>
    <h2>{HeaderMap()}</h2>
    <h3>{stationData}</h3>
    <MapContainer center={(location[0] !== 0 || location[1] !== 0) ? location : [ortData[0], ortData[1]]} zoom={13} style={{ height: "400px", width: "400px", zIndex: "0"}} attributionControl={false}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      {busData.map((position, index) => (
        <Marker key={index} position={position} icon={busIcon}></Marker>
      ))}
        <Marker position={busCoor[0]} icon={goldIcon}>
        <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: 'gold', fontWeight: "lighter", fontSize: "150%", transparent: true, fontFamily: "Russo One", letterSpacing: "2px", textShadow: "1px 1px 0 #c18103, -1px 1px 0 #c18103"}}>Başlangıç</p>
            </Tooltip>
        </Marker>
        <Marker position={busCoor[busCoor.length - 1]} icon={redIcon}>
        <Tooltip className="tooltipstyle" direction="top" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: '#cd3951', fontWeight: "lighter", fontSize: "150%", transparent: true, fontFamily: "Russo One", letterSpacing: "2px", textShadow: "1px 1px 0 #aa253b, -1px 1px 0 #aa253b"}}>Bitiş</p>
        </Tooltip>
        </Marker>
        <Marker position={location} icon={blackIcon}>
        <Tooltip className="tooltipstyle" direction="bottom" offset={[1, -25]} opacity={1} permanent>
        <p style={{ color: 'black', fontWeight: "lighter", fontSize: "100%", transparent: true, fontFamily: "Russo One"}}>Buradasın</p>
            </Tooltip>
        </Marker>
      <Polyline positions={busCoor} color="black" op  weight={3} opacity={0.7} dashArray="2, 5" lineCap="round"/>
    </MapContainer>

    <div className='mapButtons'>
    <button className='mapButtonRefresh button-30' onClick={handleRefreshClick} disabled={isButtonDisabled}>Yenile</button>
    <button className='mapButtonRemove button-30' onClick={() => removeMap(props)}>Kaldır</button>
    <button className='mapButtonInfo button-30' onClick={() => InfoFunc(props.id - 1)}>Hat Bilgisi</button>
    </div>
    <BusData busCode = {props.code} busRota = {props.rota}/>
    </div>
  );
};

export default MapComponent;
