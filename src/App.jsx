import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import InputComponent from './addBus';
import './App.css';

const App = () => {
  const [localData, setLocalData] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('savedData')) {
      localStorage.setItem('savedData', '%%490+%%490-%%305+%%305-');
    }
    const data = localStorage.getItem('savedData');
    const localData = data ? data.split('%%').map((item, index) => ({ id: index -1, title: item })) : [];
    localData.shift();
    setLocalData(localData);
  }, []);
  useEffect(() => {
    updateLocalStorage(localData);
  }, [localData]);
  

  const moveUp = (index) => {
    console.log(index);
    if (index === 0) return;
    const newData = [...localData];
    [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
    setLocalData(newData);
  };

  const moveDown = (index) => {
    if (index === localData.length - 1) return;
    const newData = [...localData];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
    setLocalData(newData);
  };

  const updateLocalStorage = (newData) => {
    if (newData.length === 0) {
      localStorage.setItem('savedData', '');
      return;
    }
    const dataString = '%%' + newData.map(item => item.title).join('%%');
    localStorage.setItem('savedData', dataString);
  };
  

  const dataComponents = localData.map((item, index) => {
    if (item.title === '') {
      return null;
    }
    let busName;
    let rotaName;
    if (item.title.includes('+')) {
      busName = item.title.split('+');
      rotaName = 0;
    } else {
      busName = item.title.split('-');
      rotaName = 1;
    }
    return (
      <div key={item.id} className="map-container">
        <MapComponent id={item.id} code={busName[0]} rota={rotaName} moveup={moveUp} movedown={moveDown} index={index} />
      </div>
    );
  });

  return (
    <>
      <InputComponent />
      <div className='mainMap' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {dataComponents}
        <a href="https://github.com/MustafaBaypara/Otobuscum" target="_blank" rel="noopener noreferrer">
          <img
            style={{ marginTop: '5%' }}
            align="center"
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
