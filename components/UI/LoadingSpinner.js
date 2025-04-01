import React from 'react';
import styles from './LoadingSpinner.module.css'; // We'll create this CSS module too

const LoadingSpinner = () => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner; 