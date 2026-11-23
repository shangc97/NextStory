export type LibraryCoordinate = { latitude: number; longitude: number };

export type SampleLibrary = {
  id: string;
  name: string;
  neighbourhood: string;
  coordinate: LibraryCoordinate;
};

/** Fictional libraries with illustrative coordinates inside Toronto. */
export const SAMPLE_LIBRARIES: readonly SampleLibrary[] = [
  { id: 'sample-civic', name: 'Civic Square Library', neighbourhood: 'Downtown', coordinate: { latitude: 43.654, longitude: -79.384 } },
  { id: 'sample-harbour', name: 'Harbour Reading Library', neighbourhood: 'Waterfront', coordinate: { latitude: 43.6405, longitude: -79.381 } },
  { id: 'sample-garden', name: 'Garden Lane Library', neighbourhood: 'Garden District', coordinate: { latitude: 43.6615, longitude: -79.374 } },
  { id: 'sample-annex', name: 'Annex Corner Library', neighbourhood: 'The Annex', coordinate: { latitude: 43.671, longitude: -79.408 } },
  { id: 'sample-trinity', name: 'Trinity Reading Room', neighbourhood: 'Trinity Bellwoods', coordinate: { latitude: 43.6475, longitude: -79.414 } },
  { id: 'sample-river', name: 'Riverbend Library', neighbourhood: 'Riverdale', coordinate: { latitude: 43.669, longitude: -79.351 } },
  { id: 'sample-junction', name: 'West Junction Library', neighbourhood: 'The Junction', coordinate: { latitude: 43.665, longitude: -79.466 } },
  { id: 'sample-midtown', name: 'Midtown Pages Library', neighbourhood: 'Midtown', coordinate: { latitude: 43.707, longitude: -79.399 } },
];

export const NEARBY_RADIUS_KM = 5;

/** Great-circle distance in kilometres; this is not walking or driving distance. */
export function distanceKm(from: LibraryCoordinate, to: LibraryCoordinate): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export type LibraryMapItem = SampleLibrary & { distanceKm: number | null };

export function getMapLibraries(coordinate: LibraryCoordinate | null): LibraryMapItem[] {
  const libraries = SAMPLE_LIBRARIES.map((library) => ({
    ...library,
    distanceKm: coordinate ? distanceKm(coordinate, library.coordinate) : null,
  }));
  if (!coordinate) return libraries;
  return libraries
    .filter((library) => library.distanceKm! <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm! - b.distanceKm!);
}

export function libraryDescription(library: LibraryMapItem): string {
  return `${library.neighbourhood} · Sample library${library.distanceKm == null ? '' : ` · ${library.distanceKm.toFixed(1)} km away (straight-line)`}`;
}
