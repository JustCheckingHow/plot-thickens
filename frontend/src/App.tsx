import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Component imports
import Layout from './components/Layout';

// Page imports
import Home from './pages/Home';
import Items from './pages/Items';
import DocumentView from './pages/DocumentView';
import LoginPage from './pages/Login';
import { Toaster } from "sonner";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <Layout>
            <Toaster />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/items" element={<Items />} />
              <Route path="/document" element={<DocumentView />} />
            </Routes>
          </Layout>
        }
      />  
    </Routes>
  );
};

export default App;