import { fetch } from 'expo/fetch';

import { type LibraryBranch, parseLibraryBranch } from '@/data/libraries';

export const TPL_BRANCH_RESOURCE_ID = '7420a950-e62b-41da-826c-32d31c46e8f8';
const API_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search';
let cachedBranches: LibraryBranch[] | null = null;

export function getCachedLibraryBranches() { return cachedBranches; }

/** Fetch all pages; only replace the in-memory cache after a complete successful response. */
export async function fetchLibraryBranches(signal?: AbortSignal): Promise<LibraryBranch[]> {
  const branches = new Map<string, LibraryBranch>();
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({ resource_id: TPL_BRANCH_RESOURCE_ID, limit: '200', offset: String(offset) });
    const response = await fetch(`${API_URL}?${params}`, { signal });
    if (!response.ok) throw new Error('The library directory is unavailable. Please try again.');
    const data = await response.json();
    if (data?.success !== true || !Array.isArray(data.result?.records)
        || !Number.isInteger(data.result.total) || data.result.total < 0) {
      throw new Error('The library directory returned an unexpected response. Please try again later.');
    }
    const records: unknown[] = data.result.records;
    for (const record of records) {
      const branch = parseLibraryBranch(record);
      if (branch) branches.set(branch.id, branch);
    }
    offset += records.length;
    if (offset >= data.result.total) break;
    if (records.length === 0 || offset >= 10000) throw new Error('The library directory could not be loaded completely. Please retry.');
  }
  if (offset > 0 && branches.size === 0) throw new Error('No usable branch locations were returned. Please try again later.');
  const result = [...branches.values()].sort((a, b) => a.name.localeCompare(b.name));
  cachedBranches = result;
  return result;
}
