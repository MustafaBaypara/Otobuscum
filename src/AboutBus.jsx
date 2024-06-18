import React, { useCallback, useEffect, useState } from 'react';

const App = (props) => {
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = (async () => {
      try {
        const response = await fetch('https://www.e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteSchedule&route_code=' + props.busCode +'&direction=' + props.busRota, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: 'route_code=' + props.busCode +'&direction=' + props.busRota
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.text();
        setHtmlContent(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='BusData' style={{display: "none"}}>
      <h1>Hat Hakkında:</h1>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default App;
