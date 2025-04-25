import React from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app">
      <header className="header">
        <h1>Sample Application</h1>
        <nav>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/items" className="nav-link">Items</Link>
        </nav>
      </header>
      
      <main className="content">
        {children}
      </main>
      
      <footer className="footer">
        <p>FastAPI + React Example Application</p>
      </footer>
    </div>
  );
};

export default Layout; 