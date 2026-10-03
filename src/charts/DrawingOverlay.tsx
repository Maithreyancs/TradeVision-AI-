import React, { useRef, useState, useEffect } from 'react';
import { DrawingItem, DrawingToolType, Point } from './drawingTypes.js';

interface DrawingOverlayProps {
  width: number;
  height: number;
  activeTool: DrawingToolType;
  drawings: DrawingItem[];
  onDrawingsChange: (drawings: DrawingItem[]) => void;
  selectedColor: string;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  width,
  height,
  activeTool,
  drawings,
  onDrawingsChange,
  selectedColor,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<{ id: string; pointIndex: number } | null>(null);

  const getCoordinates = (e: React.MouseEvent<SVGSVGElement>): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor') return;

    const pt = getCoordinates(e);

    if (activeTool === 'horizontal' || activeTool === 'support' || activeTool === 'resistance') {
      const color =
        activeTool === 'support' ? '#10B981' : activeTool === 'resistance' ? '#F43F5E' : selectedColor;
      const newDrawing: DrawingItem = {
        id: `draw_${Date.now()}`,
        toolType: activeTool,
        points: [{ x: 0, y: pt.y }, { x: width, y: pt.y }],
        color,
        lineWidth: 2,
        isCompleted: true,
      };
      onDrawingsChange([...drawings, newDrawing]);
      return;
    }

    if (activeTool === 'vertical') {
      const newDrawing: DrawingItem = {
        id: `draw_${Date.now()}`,
        toolType: activeTool,
        points: [{ x: pt.x, y: 0 }, { x: pt.x, y: height }],
        color: selectedColor,
        lineWidth: 2,
        isCompleted: true,
      };
      onDrawingsChange([...drawings, newDrawing]);
      return;
    }

    // 2-point tools: trendline, ray, fibonacci, rectangle, channel, price_range, measure
    const newDrawing: DrawingItem = {
      id: `draw_${Date.now()}`,
      toolType: activeTool,
      points: [pt, pt],
      color: selectedColor,
      lineWidth: 2,
      isCompleted: false,
    };
    setCurrentDrawing(newDrawing);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pt = getCoordinates(e);

    if (draggingPoint) {
      const updated = drawings.map((d) => {
        if (d.id === draggingPoint.id) {
          const newPts = [...d.points];
          newPts[draggingPoint.pointIndex] = pt;
          return { ...d, points: newPts };
        }
        return d;
      });
      onDrawingsChange(updated);
      return;
    }

    if (currentDrawing) {
      setCurrentDrawing({
        ...currentDrawing,
        points: [currentDrawing.points[0], pt],
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingPoint) {
      setDraggingPoint(null);
      return;
    }

    if (currentDrawing) {
      const p1 = currentDrawing.points[0];
      const p2 = currentDrawing.points[1];
      // Only keep if dragged at least a tiny bit
      if (Math.hypot(p2.x - p1.x, p2.y - p1.y) > 5) {
        onDrawingsChange([...drawings, { ...currentDrawing, isCompleted: true }]);
      }
      setCurrentDrawing(null);
    }
  };

  const renderDrawing = (d: DrawingItem) => {
    const p1 = d.points[0];
    const p2 = d.points[1] || p1;
    const isSelected = selectedId === d.id;

    switch (d.toolType) {
      case 'trendline':
      case 'ray':
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)} className="cursor-pointer">
            <line
              x1={p1.x}
              y1={p1.y}
              x2={d.toolType === 'ray' ? p1.x + (p2.x - p1.x) * 5 : p2.x}
              y2={d.toolType === 'ray' ? p1.y + (p2.y - p1.y) * 5 : p2.y}
              stroke={d.color}
              strokeWidth={d.lineWidth}
              strokeDasharray={isSelected ? '4,4' : undefined}
            />
            {isSelected && (
              <>
                <circle
                  cx={p1.x}
                  cy={p1.y}
                  r={5}
                  fill="#06B6D4"
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingPoint({ id: d.id, pointIndex: 0 });
                  }}
                />
                <circle
                  cx={p2.x}
                  cy={p2.y}
                  r={5}
                  fill="#06B6D4"
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingPoint({ id: d.id, pointIndex: 1 });
                  }}
                />
              </>
            )}
          </g>
        );

      case 'horizontal':
      case 'support':
      case 'resistance':
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)} className="cursor-pointer">
            <line
              x1={0}
              y1={p1.y}
              x2={width}
              y2={p1.y}
              stroke={d.color}
              strokeWidth={d.lineWidth}
              strokeDasharray={d.toolType === 'support' || d.toolType === 'resistance' ? '5,5' : undefined}
            />
            <text x={10} y={p1.y - 6} fill={d.color} fontSize="11" fontWeight="600">
              {d.toolType === 'support' ? 'SUPPORT' : d.toolType === 'resistance' ? 'RESISTANCE' : 'LEVEL'}
            </text>
            {isSelected && (
              <circle
                cx={width / 2}
                cy={p1.y}
                r={5}
                fill="#06B6D4"
                className="cursor-ns-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingPoint({ id: d.id, pointIndex: 0 });
                }}
              />
            )}
          </g>
        );

      case 'vertical':
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)} className="cursor-pointer">
            <line x1={p1.x} y1={0} x2={p1.x} y2={height} stroke={d.color} strokeWidth={d.lineWidth} strokeDasharray="3,3" />
          </g>
        );

      case 'rectangle': {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={`${d.color}15`}
              stroke={d.color}
              strokeWidth={d.lineWidth}
            />
          </g>
        );
      }

      case 'fibonacci':
      case 'fib_extension': {
        const levels =
          d.toolType === 'fibonacci'
            ? [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
            : [0, 0.618, 1.0, 1.618, 2.618];
        const dy = p2.y - p1.y;
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color} strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
            {levels.map((lvl) => {
              const currentY = p1.y + dy * lvl;
              const lvlColor = lvl === 0.618 || lvl === 0.5 ? '#10B981' : lvl === 1.0 ? '#06B6D4' : d.color;
              return (
                <g key={lvl}>
                  <line x1={Math.min(p1.x, p2.x)} y1={currentY} x2={Math.max(p1.x, p2.x) + 100} y2={currentY} stroke={lvlColor} strokeWidth={1.5} opacity={0.8} />
                  <text x={Math.max(p1.x, p2.x) + 105} y={currentY + 4} fill={lvlColor} fontSize="10" fontFamily="monospace">
                    {(lvl * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      case 'channel': {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const offset = 40;
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color} strokeWidth={d.lineWidth} />
            <line x1={p1.x} y1={p1.y + offset} x2={p2.x} y2={p2.y + offset} stroke={d.color} strokeWidth={d.lineWidth} strokeDasharray="4,4" />
            <polygon
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${p2.y + offset} ${p1.x},${p1.y + offset}`}
              fill={`${d.color}15`}
            />
          </g>
        );
      }

      case 'price_range':
      case 'measure': {
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);
        const isUp = p2.y < p1.y;
        const color = isUp ? '#10B981' : '#F43F5E';
        return (
          <g key={d.id} onClick={() => setSelectedId(d.id)}>
            <rect x={x} y={y} width={w} height={h} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
            <text x={x + 8} y={y + 18} fill={color} fontSize="11" fontWeight="700">
              {isUp ? '▲' : '▼'} {((h / (height || 1)) * 100).toFixed(2)}% | {Math.round(w / 10)} bars
            </text>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 pointer-events-auto ${activeTool === 'cursor' ? 'cursor-default' : 'cursor-crosshair'}`}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {drawings.map(renderDrawing)}
      {currentDrawing && renderDrawing(currentDrawing)}
    </svg>
  );
};
