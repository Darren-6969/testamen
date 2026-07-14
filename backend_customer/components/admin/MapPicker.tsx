'use client';

// Google Maps place picker for the Admin Main Page (cemetery location).
// Requires:  npm install @react-google-maps/api   (in backend_customer)
// API key:   add to backend_customer/.env.local
//            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
// Then enable "Maps JavaScript API", "Places API", "Geocoding API" and billing
// on that key's Google Cloud project.

import { useCallback, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''; // <-- key comes from .env.local
const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 3.139, lng: 101.6869 }; // Kuala Lumpur

export interface MapValue {
  lat: string;
  lon: string;
}
export interface PlaceResult {
  lat: string;
  lon: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseComponents(components: any[] = []) {
  const get = (type: string) =>
    components.find((c: any) => c.types?.includes(type))?.long_name || '';
  return {
    postcode: get('postal_code'),
    city: get('locality') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
  };
}

const box =
  'flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-neutral-50 text-center text-sm text-neutral-400';

export default function MapPicker({
  value,
  onChange,
}: {
  value: MapValue;
  onChange: (p: PlaceResult) => void;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: LIBRARIES as any,
  });

  const [marker, setMarker] = useState(() => {
    const lat = parseFloat(value.lat);
    const lng = parseFloat(value.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : DEFAULT_CENTER;
  });

  const acRef = useRef<any>(null);
  const geocoder = useMemo(
    () =>
      isLoaded && (window as any).google
        ? new (window as any).google.maps.Geocoder()
        : null,
    [isLoaded]
  );

  const emit = useCallback(
    (lat: number, lng: number, address?: string, comps?: any[]) => {
      onChange({ lat: lat.toFixed(6), lon: lng.toFixed(6), address, ...parseComponents(comps) });
    },
    [onChange]
  );

  const onPlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setMarker({ lat, lng });
    emit(lat, lng, place.formatted_address, place.address_components);
  };

  const onDragEnd = (e: any) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });
    geocoder?.geocode({ location: { lat, lng } }, (res: any, status: string) => {
      if (status === 'OK' && res?.[0])
        emit(lat, lng, res[0].formatted_address, res[0].address_components);
      else emit(lat, lng);
    });
  };

  if (!API_KEY)
    return (
      <div className={box}>
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to
        <br />
        .env.local to enable the map picker
      </div>
    );
  if (!isLoaded) return <div className={box}>Loading map...</div>;

  return (
    <div className="space-y-2">
      <Autocomplete onLoad={(ac: any) => (acRef.current = ac)} onPlaceChanged={onPlaceChanged}>
        <input
          placeholder="Search a place or address"
          className="h-[40px] w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30"
        />
      </Autocomplete>
      <div className="h-56 overflow-hidden rounded-xl border border-gray-200">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={marker}
          zoom={15}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          <Marker position={marker} draggable onDragEnd={onDragEnd} />
        </GoogleMap>
      </div>
      <p className="text-xs text-neutral-400">
        Search or drag the pin. Lat {value.lat || '—'}, Lon {value.lon || '—'}
      </p>
    </div>
  );
}