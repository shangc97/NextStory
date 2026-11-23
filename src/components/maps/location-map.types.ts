import type { LibraryMapItem } from '@/data/libraries';

export type MapCoordinate = { latitude: number; longitude: number };

export type LocationMapProps = {
  coordinate: MapCoordinate | null;
  libraries: LibraryMapItem[];
  onSelectLibrary: (id: string) => void;
};

// A browsing starting point, not an estimate of the user's location.
export const DEFAULT_MAP_CENTER: MapCoordinate = {
  latitude: 43.6532,
  longitude: -79.3832,
};

