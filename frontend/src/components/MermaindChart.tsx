// MermaidChart.tsx
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: "default",
    securityLevel: "loose",
    themeCSS: `
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
      }`,
    fontFamily: "Fira Code"
  });

interface MermaidChartProps {
  chart: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const uniqueId = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;
      containerRef.current.id = uniqueId;
      containerRef.current.innerHTML = '';
<<<<<<< HEAD
      // Render new diagram
      mermaid.render(uniqueId, chart, containerRef.current);
=======
      mermaid.render(uniqueId, chart).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      });
>>>>>>> f90d45d3459b9616b7e632059eee998d4b9c1d28
    }
  }, [chart]);

  return <div ref={containerRef} />;
};

export default MermaidChart;