import React, { useEffect, useState } from 'react';
import styles from '../../components/css/elder/events.module.css';

const ElderEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Minimal placeholder: real implementation should call an API to fetch events
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // placeholder data
        setEvents([]);
      } catch (err) {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className={styles.eventsContainer}><p>Loading events...</p></div>;
  if (error) return <div className={styles.eventsContainer}><p>{error}</p></div>;

  return (
    <div className={styles.eventsContainer}>
      <div className={styles.eventsContent}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>
            <h3>No events found</h3>
            <p>There are currently no scheduled events for this elder.</p>
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {events.map((ev) => (
              <div key={ev.id} className={styles.eventCard}>
                <h4>{ev.title}</h4>
                <p>{ev.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElderEvents;
