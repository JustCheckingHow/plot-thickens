// MermaidChart.tsx
import React, { useState, use, Suspense } from 'react';
import mermaid from 'mermaid';

const themeCSS = `
    g.classGroup rect {
      fill: var(--color-surface);
      stroke: var(--color-border);
    } 
    g.classGroup text {
      fill: var(--color-primary);
    }
    g.classGroup line {
      stroke: var(--color-border);
      stroke-width: 0.5;
    }
    .classLabel .box {
      stroke: var(--color-border);
      stroke-width: 3;
      fill: var(--color-surface);
      opacity: 1;
    }
    .classLabel .label {
      fill: var(--color-accent);
    }
    .relation {
      stroke: var(--color-secondary);
      stroke-width: 1;
    }
    #compositionStart, #compositionEnd {
      fill: var(--color-primary);
      stroke: var(--color-primary);
      stroke-width: 1;
    }
    #aggregationEnd, #aggregationStart {
      fill: var(--color-accent);
      stroke: var(--color-accent);
      stroke-width: 1;
    }
    #dependencyStart, #dependencyEnd {
      fill: var(--color-secondary);
      stroke: var(--color-secondary);
      stroke-width: 1;
    } 
    #extensionStart, #extensionEnd {
      fill: var(--color-muted);
      stroke: var(--color-muted);
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
  
  try {
    const svg = await mermaid.render(uniqueId, chart);
    return { id: uniqueId, svg: svg };
  } catch (error) {
    console.error("Failed to render mermaid diagram:", error);
    return { id: uniqueId, svg: "" };
  }
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
      style={isPreview ? { transform: 'scale(1)', transformOrigin: 'center' } : {}}
    />
  );
}

const MermaidChart = ({ chart }: MermaidChartProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  console.log(chart)
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
        className="mermaid-chart-preview mt-4" 
        onClick={openModal}
        style={{ 
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: '4px',
          padding: '8px',
          display: 'inline-block',
          maxWidth: '100%',
          width: '100%',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
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