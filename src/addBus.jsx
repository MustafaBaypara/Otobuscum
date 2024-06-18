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
    setInputValue(event.target.value);
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

  return (
    <div className='inputDiv'>
        <h1>Otobüs ekle!</h1>
        <input type="text" value={inputValue} onChange={handleChange} placeholder='Hat Giriniz.'/>
        <button onClick={() => handleClick('gidiş')}>Gidiş</button>
        <button onClick={() => handleClick('dönüş')}>Dönüş</button>
    </div>
  );
};

export default InputComponent;
