import React, { useState, useEffect } from 'react';

const InputComponent = () => {
  const [inputValue, setInputValue] = useState('');
  const [savedData, setSavedData] = useState('');

  useEffect(() => {
    const data = localStorage.getItem('savedData');
    if (data) {
      setSavedData(data);
    }
  }, [inputValue]);

  const handleChange = (event) => {
    const value = event.target.value;
    setInputValue(value.replace(/[a-z]/g, (char) => char.toUpperCase()));
  };


  const handleClick = (type) => {
    let newData = localStorage.getItem('savedData');
    if (!inputValue)
      return ;
    if (type === 'gidiş') {
      if (!newData.includes('%%' + inputValue + '+'))
      {newData = savedData + '%%' + inputValue + '+'; }
    } else if (type === 'dönüş') {
      if (!newData.includes('%%' + inputValue + '-'))
      { newData = savedData + '%%' + inputValue + '-'; }
    }
    
    localStorage.setItem('savedData', newData);
    setInputValue('');
    setSavedData(newData);
    newData = '';
    window.location.reload();
  };

  const handleReset = () => {
    //uyari penceresi

    if (window.confirm('Uygulama düzgün çalışmıyorsa sıfırlamak işe yarayabilir. \nTüm veriler silinecek. Onaylıyor musunuz?')) {

    localStorage.setItem('savedData', '');
    localStorage.setItem('visible', '');
    window.location.reload();
    }
  }
  
  return (
    <div className='inputDiv'>
        <h1>Otobüs ekle!</h1>
        <input type="text" value={inputValue} onChange={handleChange} placeholder='Hat Giriniz.'/>
        <div style={{gap: "15px", display: "flex", marginTop: "3%"}}>
        <button className="button-30" onClick={() => handleClick('gidiş')}>Gidiş</button>
        <button className="button-30" onClick={() => handleClick('dönüş')}>Dönüş</button>
        <button className="button-30" onClick={() => handleReset()}>Sıfırla</button>
        </div>
    </div>
  );
};

export default InputComponent;
