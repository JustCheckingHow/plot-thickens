// MermaidChart.tsx
import React, { useState, use, Suspense } from 'react';
import mermaid from 'mermaid';

const themeCSS = `
    g.classGroup rect {
      fill: #282a36;
      stroke: #6272a4;
    } 
    g.classGroup text {
      fill: #f8f8f2;
    }
    g.classGroup line {
      stroke: #f8f8f2;
      stroke-width: 0.5;
    }
    .classLabel .box {
      stroke: #21222c;
      stroke-width: 3;
      fill: #21222c;
      opacity: 1;
    }
    .classLabel .label {
      fill: #f1fa8c;
    }
    .relation {
      stroke: #ff79c6;
      stroke-width: 1;
    }
    #compositionStart, #compositionEnd {
      fill: #bd93f9;
      stroke: #bd93f9;
      stroke-width: 1;
    }
    #aggregationEnd, #aggregationStart {
      fill: #21222c;
      stroke: #50fa7b;
      stroke-width: 1;
    }
    #dependencyStart, #dependencyEnd {
      fill: #00bcd4;
      stroke: #00bcd4;
      stroke-width: 1;
    } 
    #extensionStart, #extensionEnd {
      fill: #f8f8f2;
      stroke: #f8f8f2;
      stroke-width: 1;
    }`

interface MermaidChartProps {
  chart: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  securityLevel: "loose",
  themeCSS: themeCSS,
  fontFamily: "Fira Code"
});

// Async function to render mermaid diagram
async function renderMermaidDiagram(chart: string, isPreview: boolean = false) {
  const uniqueId = `mermaid-${isPreview ? 'preview' : 'diagram'}-${Math.random().toString(36).substr(2, 9)}`;
  if (!chart) {
    return { id: uniqueId, svg: "" };
  }
  const svg = await mermaid.render(uniqueId, chart);
  return { id: uniqueId, svg: svg };
}

// Component that renders the diagram using the use hook
function MermaidRenderer({ diagramPromise, isPreview = false }: { diagramPromise: Promise<{id: string, svg: string}>, isPreview?: boolean }) {
  const diagram = use(diagramPromise);
  if (!diagram.svg) {
    return <div></div>;
  }
  return (
    <div 
      id={diagram.id} 
      dangerouslySetInnerHTML={{ __html: diagram.svg }} 
      style={isPreview ? { transform: 'scale(0.7)', transformOrigin: 'top left' } : {}}
    />
  );
}

const MermaidChart = ({ chart }: MermaidChartProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  // Handle clicking outside to close
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!chart) {
    return <div></div>;
  }

  return (
    <>
      <div 
        className="mermaid-chart-preview" 
        onClick={openModal}
        style={{ 
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          display: 'inline-block',
          maxWidth: '300px',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
      >
        <Suspense fallback={<div>Loading preview...</div>}>
          <MermaidRenderer diagramPromise={renderMermaidDiagram(chart, true)} isPreview={true} />
        </Suspense>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Click to expand
        </div>
      </div>

      {isOpen && (
        <div 
          className="mermaid-modal-overlay"
          onClick={handleOutsideClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="mermaid-modal-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
            <Suspense fallback={<div>Loading diagram...</div>}>
              <MermaidRenderer diagramPromise={renderMermaidDiagram(chart)} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

export default MermaidChart;