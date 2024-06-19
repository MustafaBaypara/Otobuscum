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
      return <MapComponent id={item.id} code={busName[0]} rota={rotaName} />;
    });

    return (
      <>
      <InputComponent />
      <div className='mainMap'>
        {dataComponents}
      <a href="https://github.com/MustafaBaypara/Otobuscum" target="_blank" rel="noopener noreferrer">
      <img style={{marginTop: "5%"}} align="center" src="https://github-readme-stats.vercel.app/api/pin/?username=mustafabaypara&repo=otobuscum&show_owner=true&bg_color=151515&text_color=9f9f9f&icon_color=fff&title_color=fff" />
      </a>
      </div>
      <style>
      @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap')
      </style>
      </>
    );
};

export default App;
