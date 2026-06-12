import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { HeroSection } from '../../components/HeroSection';

/**
 * Main localized Page component.
 * Layouts Navbar, Sidebar, and HeroSection.
 */
export default function LocalePage() {
  return (
    <div
      style={{
        backgroundColor: '#0a0a0c',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
      }}
    >
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#050507',
          }}
        >
          <HeroSection />
        </main>
      </div>
    </div>
  );
}
