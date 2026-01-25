'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Space } from '@/domain/entities/space.entity';
import { createAdvancedMarkerIcon } from './map/utils/markerUtils';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to fit map bounds to markers
function MapBounds({ sites }: { sites: Space[] }) {
  const map = useMap();

  useEffect(() => {
    if (sites.length > 0) {
      const sitesWithLocation = sites.filter(site => site.location);
      if (sitesWithLocation.length > 0) {
        const bounds = L.latLngBounds(
          sitesWithLocation.map(site => [site.location!.latitude, site.location!.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return null;
}

interface SitesMapProps {
  sites: Space[];
  className?: string;
  onSiteSelect?: (site: Space | null) => void;
  selectedSite?: Space | null;
}

export default function SitesMap({ sites, className = '', onSiteSelect, selectedSite }: SitesMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Center of India (approximate)
  const center: [number, number] = [20.5937, 78.9629];

  const handleMarkerClick = (site: Space) => {
    if (onSiteSelect) {
      onSiteSelect(site);
    }
    
    // Optionally zoom to the site
    if (mapRef && site.location) {
      mapRef.flyTo([site.location.latitude, site.location.longitude], 8, {
        duration: 1,
      });
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={true}
      ref={setMapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds sites={sites} />
      
      {sites.filter(site => site.location && site.metrics).map((site) => (
        <Marker
          key={`${site.id}-${site.metrics?.currentPower}-${site.metrics?.status}`}
          position={[site.location!.latitude, site.location!.longitude]}
          icon={createAdvancedMarkerIcon(site, {
            showCapacityRing: true,
            showKPI: true,
            showAlertBadge: true,
          })}
          eventHandlers={{
            click: () => handleMarkerClick(site),
          }}
        />
      ))}
    </MapContainer>
  );
}
