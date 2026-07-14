/// <reference types="google.maps" />
'use client';

// Google Maps place picker for the Admin Main Page (cemetery location).
// Library:  npm install @vis.gl/react-google-maps   (in backend_customer)
// Env:      backend_customer/.env.local
//             NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
//             NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_vector_map_id   <-- required by <AdvancedMarker>
// Cloud:    enable Maps JavaScript API + Places API + Geocoding API, and attach a
//           billing account to the project (otherwise the map renders greyed-out
//           with a "For development purposes only" watermark).
//
// If TS complains about the `google.maps.*` types, run:
//   npm install -D @types/google.maps

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '';
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

type LatLng = { lat: number; lng: number };

function parseComponents(
  components: google.maps.GeocoderAddressComponent[] = []
) {
  const get = (type: string) =>
    components.find((c) => c.types?.includes(type))?.long_name || '';
  return {
    postcode: get('postal_code'),
    city: get('locality') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
  };
}

const box =
  'flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-neutral-50 text-center text-sm text-neutral-400';

const inputCls =
  'h-[40px] w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30';

/* ------------------------------------------------------------------ *
 * Autocomplete search box (uses the Places library on demand).
 * ------------------------------------------------------------------ */
function PlaceSearch({
  onPlace,
}: {
  onPlace: (place: google.maps.places.PlaceResult) => void;
}) {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const [ac, setAc] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    setAc(
      new places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'formatted_address', 'address_components'],
      })
    );
  }, [places]);

  useEffect(() => {
    if (!ac) return;
    const listener = ac.addListener('place_changed', () => onPlace(ac.getPlace()));
    return () => listener.remove();
  }, [ac, onPlace]);

  return (
    <input ref={inputRef} placeholder="Search a place or address" className={inputCls} />
  );
}

/* ------------------------------------------------------------------ *
 * Inner picker: map + draggable marker + reverse geocode. Rendered
 * inside <APIProvider> so the hooks have context.
 * ------------------------------------------------------------------ */
function PickerInner({
  value,
  onChange,
}: {
  value: MapValue;
  onChange: (p: PlaceResult) => void;
}) {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const [marker, setMarker] = useState<LatLng>(() => {
    const lat = parseFloat(value.lat);
    const lng = parseFloat(value.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : DEFAULT_CENTER;
  });

  useEffect(() => {
    if (geocodingLib) setGeocoder(new geocodingLib.Geocoder());
  }, [geocodingLib]);

  const emit = useCallback(
    (
      lat: number,
      lng: number,
      address?: string,
      comps?: google.maps.GeocoderAddressComponent[]
    ) => {
      onChange({
        lat: lat.toFixed(6),
        lon: lng.toFixed(6),
        address,
        ...parseComponents(comps),
      });
    },
    [onChange]
  );

  const onPlace = useCallback(
    (place: google.maps.places.PlaceResult) => {
      const loc = place.geometry?.location;
      if (!loc) return;
      const lat = loc.lat();
      const lng = loc.lng();
      setMarker({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(16);
      emit(lat, lng, place.formatted_address, place.address_components);
    },
    [map, emit]
  );

  const onDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const loc = e.latLng;
      if (!loc) return;
      const lat = loc.lat();
      const lng = loc.lng();
      setMarker({ lat, lng });
      geocoder?.geocode({ location: { lat, lng } }, (res, status) => {
        if (status === 'OK' && res?.[0])
          emit(lat, lng, res[0].formatted_address, res[0].address_components);
        else emit(lat, lng);
      });
    },
    [geocoder, emit]
  );

  return (
    <div className="space-y-2">
      <PlaceSearch onPlace={onPlace} />
      <div className="h-56 overflow-hidden rounded-xl border border-gray-200">
        <Map
          mapId={MAP_ID}
          style={{ width: '100%', height: '100%' }}
          defaultCenter={marker}
          defaultZoom={15}
          gestureHandling="greedy"
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
        >
          <AdvancedMarker position={marker} draggable onDragEnd={onDragEnd} />
        </Map>
      </div>
      <p className="text-xs text-neutral-400">
        Search or drag the pin. Lat {value.lat || '—'}, Lon {value.lon || '—'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Public component: guards + APIProvider wrapper.
 * ------------------------------------------------------------------ */
export default function MapPicker({
  value,
  onChange,
}: {
  value: MapValue;
  onChange: (p: PlaceResult) => void;
}) {
  if (!API_KEY)
    return (
      <div className={box}>
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to
        <br />
        .env.local to enable the map picker
      </div>
    );
  if (!MAP_ID)
    return (
      <div className={box}>
        Add NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID to
        <br />
        .env.local (a vector Map ID) to enable the marker
      </div>
    );

  return (
    <APIProvider apiKey={API_KEY}>
      <PickerInner value={value} onChange={onChange} />
    </APIProvider>
  );
}