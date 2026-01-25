/**
 * Map Utilities: Marker Generation and Styling
 */

import { Space } from '@/domain/entities/space.entity';
import { EquipmentStatus } from '@/domain/entities/equipment.entity';
import L from 'leaflet';

/**
 * Get color for site status
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    online: '#10b981',    // green-500
    warning: '#f59e0b',   // amber-500
    offline: '#ef4444',   // red-500
    error: '#dc2626',     // red-600
    fault: '#f97316',     // orange-500
    maintenance: '#6b7280', // gray-500
  };
  return colors[status] || '#6b7280';
};

/**
 * Get capacity utilization percentage (0-100)
 */
export const getCapacityUtilization = (site: Space): number => {
  if (!site.metrics || !site.capacity) return 0;
  
  const currentPower = site.metrics.currentPower;
  const totalCapacity = site.capacity.solar + site.capacity.storage;
  
  if (totalCapacity === 0) return 0;
  
  return Math.min(100, Math.max(0, (currentPower / totalCapacity) * 100));
};

/**
 * Get alarm count for site
 */
export const getAlarmCount = (site: Space): number => {
  // This will be populated from equipment alarms
  return 0; // Placeholder
};

/**
 * Create custom HTML marker with capacity ring
 */
export const createAdvancedMarkerIcon = (
  site: Space,
  options: {
    showCapacityRing?: boolean;
    showKPI?: boolean;
    showAlertBadge?: boolean;
  } = {}
): L.DivIcon => {
  const {
    showCapacityRing = true,
    showKPI = true,
    showAlertBadge = true,
  } = options;

  const status = site.metrics?.status || 'offline';
  const color = getStatusColor(status);
  const utilization = getCapacityUtilization(site);
  const alarmCount = getAlarmCount(site);
  const power = site.metrics?.currentPower || 0;
  const hasCriticalAlarm = status === 'error';

  // SVG for capacity ring
  const ringRadius = 20;
  const ringStrokeWidth = 3;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringCircumference * utilization) / 100;

  const html = `
    <div class="advanced-marker" style="position: relative; width: 48px; height: 48px;">
      ${showCapacityRing ? `
        <svg width="48" height="48" style="position: absolute; top: 0; left: 0; transform: rotate(-90deg);">
          <!-- Background ring -->
          <circle
            cx="24"
            cy="24"
            r="${ringRadius}"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="${ringStrokeWidth}"
          />
          <!-- Capacity ring -->
          <circle
            cx="24"
            cy="24"
            r="${ringRadius}"
            fill="none"
            stroke="${color}"
            stroke-width="${ringStrokeWidth}"
            stroke-dasharray="${ringCircumference}"
            stroke-dashoffset="${ringOffset}"
            stroke-linecap="round"
            opacity="0.8"
            style="transition: stroke-dashoffset 1s ease-in-out, stroke 0.5s ease;"
          />
        </svg>
      ` : ''}
      
      <!-- Core marker -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.5s ease, transform 0.3s ease;
        ${hasCriticalAlarm ? 'animation: pulse-alarm 1.5s ease-in-out infinite;' : ''}
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>

      ${showKPI && power > 0 ? `
        <div style="
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border: 1px solid ${color};
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          color: ${color};
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: color 0.5s ease, border-color 0.5s ease;
        ">
          ${power >= 1000 ? (power / 1000).toFixed(1) + 'MW' : power.toFixed(0) + 'kW'}
        </div>
      ` : ''}

      ${showAlertBadge && alarmCount > 0 ? `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          animation: badge-pop 0.3s ease;
        ">
          ${alarmCount}
        </div>
      ` : ''}
    </div>

    <style>
      @keyframes pulse-alarm {
        0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
      }
      @keyframes badge-pop {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    </style>
  `;

  return L.divIcon({
    className: 'custom-advanced-marker',
    html: html,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

/**
 * Create simple marker icon (for fallback or performance mode)
 */
export const createSimpleMarkerIcon = (status: string): L.DivIcon => {
  const color = getStatusColor(status);
  
  const html = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-marker',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};
