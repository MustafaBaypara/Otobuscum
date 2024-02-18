import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = (props) => {
  const [busData, setBusData] = useState([]);
  const [ortData, setOrtData] = useState([]);
  const HeaderMap = () => {
  if (props.rota == 0) {
    return (props.code + " Gidiş")
  } else {
    return (props.code + " Dönüş")
  }}
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchBusesontheRoute&route_code=' + props.code +'&direction=' + props.rota);
        if (!response.ok) {
          throw new Error('Veri alınamadı');
        }
        const textData = await response.text();
        const parser = new DOMParser();
        const html = parser.parseFromString(textData, 'text/html');
        const data = Array.from(html.querySelectorAll('li input')).map(input => input.value.split('+').map(parseFloat));
        setBusData(data);
      } catch (error) {
        console.error('Hata:', error);
      }
    };

    const interval = setInterval(fetchData, 5000);
    fetchData();

    return () => clearInterval(interval);}, []);

  useEffect(() => {
    if (busData.length > 0) {
      const ortalamaListe = [];
      for (let i = 0; i < busData.length; i++) {
        const ortalama = busData.reduce((acc, cur) => acc + cur[i], 0) / busData.length;
        ortalamaListe.push(ortalama);
      }
      setOrtData(ortalamaListe);
    }
  }, [busData]);

  if (busData.length === 1) {
    return (
    <div className='mapClass' id={props.id}>
      <h2>{HeaderMap()}</h2>
      <MapContainer center={busData[0]} zoom={13} style={{ height: "400px", width: "400px"}} attributionControl={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <Marker position={busData[0]}></Marker>
    </MapContainer>
    <button className='mapButtonRemove' onClick={() => removeMap(props)}>Kaldır</button>
    </div>
    );
  }

  if (busData.length === 0 || ortData.length === 0) {
    return null;
  }

  return (
    <div className='mapClass' id={props.id}>
    <h2>{HeaderMap()}</h2>
    <MapContainer center={[ortData[0], ortData[1]]} zoom={13} style={{ height: "400px", width: "400px"}} attributionControl={false}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      
      {busData.map((position, index) => (
        <Marker key={index} position={position}></Marker>
      ))}
    </MapContainer>
    <button className='mapButtonRemove' onClick={() => removeMap(props)}>Kaldır</button>
    </div>
  );
};

export default MapComponent;
