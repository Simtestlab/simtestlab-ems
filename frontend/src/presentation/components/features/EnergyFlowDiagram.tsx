'use client';

import { useEffect, useState } from 'react';
import { RealtimeMetrics } from '@/domain/entities/metrics.entity';
import { formatPower } from '@/shared/utils/formatting';
import { Zap, Sun, Home, Battery } from 'lucide-react';

interface EnergyFlowDiagramProps {
  metrics: RealtimeMetrics;
}

interface FlowPath {
  from: string;
  to: string;
  value: number;
  color: string;
  label: string;
}

export default function EnergyFlowDiagram({ metrics }: EnergyFlowDiagramProps) {
  const [flows, setFlows] = useState<FlowPath[]>([]);

  useEffect(() => {
    const calculatedFlows: FlowPath[] = [];
    
    const solar = Math.max(0, metrics.solar.activePower);
    const consumption = Math.max(0, metrics.consumption.activePower);
    const storage = metrics.storage.activePower;
    const grid = metrics.grid.activePower;

    // Solar to Consumption (direct use)
    const solarToConsumption = Math.min(solar, consumption);
    if (solarToConsumption > 1) {
      calculatedFlows.push({
        from: 'solar',
        to: 'consumption',
        value: solarToConsumption,
        color: '#f59e0b',
        label: formatPower(solarToConsumption, 1),
      });
    }

    // Solar to Storage (charging)
    const solarToStorage = Math.max(0, Math.min(solar - solarToConsumption, storage));
    if (solarToStorage > 1) {
      calculatedFlows.push({
        from: 'solar',
        to: 'storage',
        value: solarToStorage,
        color: '#3b82f6',
        label: formatPower(solarToStorage, 1),
      });
    }

    // Solar to Grid (export)
    const solarToGrid = Math.max(0, solar - solarToConsumption - solarToStorage);
    if (solarToGrid > 1) {
      calculatedFlows.push({
        from: 'solar',
        to: 'grid',
        value: solarToGrid,
        color: '#10b981',
        label: formatPower(solarToGrid, 1),
      });
    }

    // Storage to Consumption (discharging)
    const storageToConsumption = Math.max(0, -storage);
    if (storageToConsumption > 1) {
      calculatedFlows.push({
        from: 'storage',
        to: 'consumption',
        value: storageToConsumption,
        color: '#8b5cf6',
        label: formatPower(storageToConsumption, 1),
      });
    }

    // Grid to Consumption (import)
    const gridToConsumption = Math.max(0, grid);
    if (gridToConsumption > 1) {
      calculatedFlows.push({
        from: 'grid',
        to: 'consumption',
        value: gridToConsumption,
        color: '#ef4444',
        label: formatPower(gridToConsumption, 1),
      });
    }

    setFlows(calculatedFlows);
  }, [metrics]);

  const nodes = [
    { id: 'grid', label: 'Grid', icon: Zap, x: 50, y: 150, color: '#6b7280' },
    { id: 'solar', label: 'Solar', icon: Sun, x: 250, y: 50, color: '#f59e0b' },
    { id: 'storage', label: 'Storage', icon: Battery, x: 250, y: 250, color: '#3b82f6' },
    { id: 'consumption', label: 'Load', icon: Home, x: 450, y: 150, color: '#10b981' },
  ];

  const getPath = (from: string, to: string): string => {
    const fromNode = nodes.find(n => n.id === from);
    const toNode = nodes.find(n => n.id === to);
    if (!fromNode || !toNode) return '';

    const startX = fromNode.x + 40;
    const startY = fromNode.y + 20;
    const endX = toNode.x;
    const endY = toNode.y + 20;
    
    const midX = (startX + endX) / 2;
    
    return `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${(startY + endY) / 2} T ${endX} ${endY}`;
  };

  const maxFlow = Math.max(...flows.map(f => f.value), 1);

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white rounded-lg p-8">
      <svg width="100%" height="100%" viewBox="0 0 550 350" className="overflow-visible">
        <defs>
          {flows.map((flow, index) => (
            <linearGradient key={`gradient-${index}`} id={`flow-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={flow.color} stopOpacity="0.2" />
              <stop offset="50%" stopColor={flow.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={flow.color} stopOpacity="0.2" />
              <animate
                attributeName="x1"
                values="0%;100%"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="100%;200%"
                dur="3s"
                repeatCount="indefinite"
              />
            </linearGradient>
          ))}
        </defs>

        {/* Flow paths */}
        {flows.map((flow, index) => {
          const strokeWidth = (flow.value / maxFlow) * 30 + 5;
          return (
            <g key={`flow-${index}`}>
              <path
                d={getPath(flow.from, flow.to)}
                fill="none"
                stroke={`url(#flow-gradient-${index})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d={getPath(flow.from, flow.to)}
                fill="none"
                stroke={flow.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity="0.4"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-10"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const Icon = node.icon;
          const nodeMetric = 
            node.id === 'grid' ? formatPower(metrics.grid.activePower, 1) :
            node.id === 'solar' ? formatPower(metrics.solar.activePower, 1) :
            node.id === 'storage' ? `${Math.round(metrics.storage.soc)}%` :
            formatPower(metrics.consumption.activePower, 1);

          return (
            <g key={node.id}>
              <circle
                cx={node.x + 20}
                cy={node.y + 20}
                r="30"
                fill="white"
                stroke={node.color}
                strokeWidth="3"
                filter="drop-shadow(0 2px 8px rgba(0,0,0,0.15))"
              />
              <foreignObject x={node.x + 5} y={node.y + 5} width="30" height="30">
                <div className="flex items-center justify-center w-full h-full">
                  <Icon size={20} color={node.color} />
                </div>
              </foreignObject>
              <text
                x={node.x + 20}
                y={node.y + 60}
                textAnchor="middle"
                className="text-sm font-semibold fill-gray-900"
              >
                {node.label}
              </text>
              <text
                x={node.x + 20}
                y={node.y + 76}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-600"
              >
                {nodeMetric}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Grid Import</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Grid Export</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600">Solar Generation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">Battery Charging</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-600">Battery Discharging</span>
        </div>
      </div>
    </div>
  );
}
