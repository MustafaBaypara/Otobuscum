import React from 'react';
import MapComponent from './map';
import InputComponent from './addBus';
import './App.css';

const App = () => {
    
    if (!localStorage.getItem('savedData')) {
      localStorage.setItem('savedData', '%%490+%%490-');
    }
    const data = localStorage.getItem('savedData');
    const localData = data ? data.split('%%').map((item, index) => ({ id: index, title: item })) : [];
    const dataComponents = localData.map(item => {
      let busName;
      let rotaName;
      if (item.title.includes('+')) {
        busName = item.title.split('+');
        rotaName = 0;
      } else {
        busName = item.title.split('-');
        rotaName = 1;
      }
      return <MapComponent id={item.id} code={busName[0]} rota={rotaName} />;
    });


    return (
      <>
      <InputComponent />
      <div className='mainMap'>
        {dataComponents}
      </div>
      <style>
      @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap')
      </style>
      </>
    );
};

export default App;
