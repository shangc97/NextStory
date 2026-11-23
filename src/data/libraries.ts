export type LibraryCoordinate = { latitude: number; longitude: number };

export type LibraryBranch = {
  id: string;
  name: string;
  address: string;
  hours: string;
  coordinate: LibraryCoordinate;
};

export const LIBRARY_DATASET_URL = 'https://open.toronto.ca/dataset/library-branch-general-information/';
export const LIBRARY_LICENCE_URL = 'https://open.toronto.ca/open-data-licence/';

/** Only physical branches with usable Toronto coordinates are mapped. */
export function parseLibraryBranch(value: unknown): LibraryBranch | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (row.PhysicalBranch !== 1 && row.PhysicalBranch !== '1') return null;
  const clean = (field: unknown) => typeof field === 'string' ? field.trim() : '';
  const id = clean(row.BranchCode);
  const name = clean(row.BranchName);
  const lat = typeof row.Lat === 'number' ? row.Lat : clean(row.Lat);
  const lon = typeof row.Long === 'number' ? row.Long : clean(row.Long);
  if (lat === '' || lon === '') return null;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < 43.58 || latitude > 43.9 || longitude < -79.66 || longitude > -79.1) return null;
  return {
    id, name,
    address: clean(row.Address) || 'Address unavailable',
    hours: clean(row.Hours) || 'Hours unavailable. Check with the branch before visiting.',
    coordinate: { latitude, longitude },
  };
}

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

export type LibraryMapItem = LibraryBranch & { distanceKm: number | null };

export function getMapLibraries(branches: readonly LibraryBranch[], coordinate: LibraryCoordinate | null): LibraryMapItem[] {
  const libraries = branches.map((library) => ({
    ...library,
    distanceKm: coordinate ? distanceKm(coordinate, library.coordinate) : null,
  }));
  if (!coordinate) return libraries;
  return libraries
    .filter((library) => library.distanceKm! <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm! - b.distanceKm!);
}

export function libraryDescription(library: LibraryMapItem): string {
  return `${library.address}\n${library.hours}${library.distanceKm == null ? '' : `\n${library.distanceKm.toFixed(1)} km away (straight-line)`}`;
}
