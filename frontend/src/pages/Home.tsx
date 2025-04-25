import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="page">
      <h1>Home Page</h1>
      <p>Welcome to the sample application.</p>
      <Link to="/items" className="link">View Items</Link>
    </div>
  );
};

export default Home; 