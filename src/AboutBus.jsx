import { useEffect, useState } from 'react';
import { fetchRouteSchedule } from './ekomobilApi';

const AboutBus = ({ busCode, busRota, isVisible }) => {
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only fetch schedule once when the user opens it or when props change
    if (!isVisible) return;
    if (hasLoaded && htmlContent) return;

    let isMounted = true;
    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const scheduleHtml = await fetchRouteSchedule(busCode, busRota);
        if (isMounted) {
          setHtmlContent(scheduleHtml);
          setHasLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Tarife bilgisi alınamadı');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [busCode, busRota, isVisible, hasLoaded, htmlContent]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="BusData" style={{ display: 'block', padding: '10px', textAlign: 'left' }}>
      <h3 style={{ borderBottom: '2px solid #007e7e', paddingBottom: '6px', margin: '10px 0' }}>
        {busCode} {busRota === 0 ? 'Gidiş' : 'Dönüş'} Sefer Saatleri & Bilgi:
      </h3>

      {loading && <div style={{ textAlign: 'center', padding: '15px' }}>Yükleniyor...</div>}

      {error && (
        <div style={{ color: '#b60000', padding: '10px', textAlign: 'center' }}>
          Bilgi yüklenemedi: {error}
        </div>
      )}

      {!loading && htmlContent && (
        <div
          className="schedule-container"
          style={{ maxHeight: '350px', overflowY: 'auto', fontSize: '13px' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  );
};

export default AboutBus;
