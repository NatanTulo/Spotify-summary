// Custom CSS for better Recharts Brush styling
// Shared across timeline charts

export const brushStyles = `
  .recharts-brush {
    user-select: none;
  }
  
  .recharts-brush .recharts-brush-traveller {
    fill: hsl(var(--primary)) !important;
    stroke: hsl(var(--background)) !important;
    stroke-width: 2px !important;
    cursor: ew-resize !important;
    opacity: 0.8;
    transition: all 0.2s ease;
  }
  
  .recharts-brush .recharts-brush-traveller:hover {
    fill: hsl(var(--primary)) !important;
    stroke: hsl(var(--background)) !important;
    opacity: 1;
    transform: scaleY(1.1);
  }
  
  .recharts-brush .recharts-brush-slide {
    fill: hsl(var(--primary)/0.15) !important;
    stroke: hsl(var(--primary)) !important;
    stroke-width: 1px !important;
    cursor: move !important;
    transition: all 0.2s ease;
  }
  
  .recharts-brush .recharts-brush-slide:hover {
    fill: hsl(var(--primary)/0.25) !important;
    stroke: hsl(var(--primary)) !important;
    stroke-width: 1.5px !important;
  }
  
  .recharts-brush .recharts-brush-texts {
    fill: hsl(var(--foreground)) !important;
    font-size: 11px !important;
    font-weight: 500 !important;
  }
  
  /* Better mobile responsiveness */
  @media (max-width: 640px) {
    .recharts-brush .recharts-brush-traveller {
      width: 14px !important;
      cursor: grab !important;
    }
    
    .recharts-brush .recharts-brush-traveller:active {
      cursor: grabbing !important;
    }
    
    .recharts-brush .recharts-brush-texts {
      font-size: 10px !important;
    }
  }
  
  @media (max-width: 480px) {
    .recharts-brush .recharts-brush-traveller {
      width: 16px !important;
    }
  }
`;
