import React from 'react';
import Nav from '@/components/Nav/Nav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app flex" style={{
      minHeight: "100dvh",
      background: "#f7ebe4"
    }}>
      <main className="flex w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout; 