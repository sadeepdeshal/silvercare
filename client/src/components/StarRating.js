import React from 'react';
import styles from './css/StarRating.module.css';

const StarRating = ({ rating }) => {
  const ratingNumber = Number(rating);
  
  // If rating is "No ratings", return text
  if (rating === 'No ratings') {
    return <span>No ratings yet</span>;
  }

  // Create array of 5 stars
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= ratingNumber) {
      stars.push(<span key={i} className={styles.starFilled}>★</span>); // filled star
    } else if (i - ratingNumber < 1) {
      stars.push(<span key={i} className={styles.starHalf}>★</span>); // half star
    } else {
      stars.push(<span key={i} className={styles.starEmpty}>☆</span>); // empty star
    }
  }

  return (
    <div className={styles.starRating}>
      {stars} <span className={styles.ratingNumber}>({rating})</span>
    </div>
  );
};

export default StarRating;