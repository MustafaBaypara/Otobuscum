import React, { useState, useEffect } from 'react';

const InputComponent = () => {
  const [inputValue, setInputValue] = useState('');
  const [savedData, setSavedData] = useState('');

  useEffect(() => {
    const data = localStorage.getItem('savedData');
    if (data) {
      setSavedData(data);
    }
  }, []);

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleClick = (type) => {
    let newData = inputValue;
    if (type === 'gidiş') {
    newData = savedData + '%%' + inputValue + '+';
    } else if (type === 'dönüş') {
    newData = savedData + '%%' + inputValue + '-';
    }
    
    localStorage.setItem('savedData', newData);
    setInputValue('');
    setSavedData(newData);
    window.location.reload();
  };

  return (
    <div className='inputDiv'>
        <h1>Otobüs ekle!</h1>
        <input type="text" value={inputValue} onChange={handleChange} />
        <button onClick={() => handleClick('gidiş')}>Gidiş</button>
        <button onClick={() => handleClick('dönüş')}>Dönüş</button>
    </div>
  );
};

export default InputComponent;
