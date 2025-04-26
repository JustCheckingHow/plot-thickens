import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="page">
      <h1>Test</h1>
      <p>Welcome to the sample application.</p>
      <Link to={"/document"}>Przejdź do dokumentu</Link>
    </div> 
  );
};

export default Home; 