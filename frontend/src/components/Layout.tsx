import React from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app flex flex-column bg-zinc-900 text-white dark" style={{
      flexDirection: "column",
      minHeight: "100vh"
    }}>
      <Nav/>      
      <main className="content container mx-auto py-4">
        {children}
      </main>
      
      <Footer/>
    </div>
  );
};

export default Layout; 