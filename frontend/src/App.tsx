import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Component imports
import Layout from './components/Layout';

// Page imports
import Home from './pages/Home';
import Items from './pages/Items';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <Layout>
          <Home />
        </Layout>
      } />
      <Route path="/items" element={
        <Layout>
          <Items />
        </Layout>
      } />
    </Routes>
  );
};

export default App; 