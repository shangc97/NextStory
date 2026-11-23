/** Test the production parser/fetcher offline; --live also makes one read-only official API check. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(file, modules = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', code)((name) => {
    assert(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, exports);
  return exports;
}
const model = load('src/data/libraries.ts');
const row = {
  BranchCode: 'AB', BranchName: 'Albion', PhysicalBranch: 1,
  Lat: '43.73999', Long: '-79.5845', Address: '1515 Albion Road', Hours: 'Mon 9 a.m. to 8:30 p.m.',
};
const branch = model.parseLibraryBranch(row);
assert.deepEqual(branch.coordinate, { latitude: 43.73999, longitude: -79.5845 });
assert.equal(branch.address, row.Address);
assert.equal(branch.hours, row.Hours);
assert.equal(model.parseLibraryBranch({ ...row, PhysicalBranch: 0 }), null);
assert.equal(model.parseLibraryBranch({ ...row, Lat: '' }), null);
assert.equal(model.parseLibraryBranch({ ...row, Long: 'not-a-number' }), null);
assert.equal(model.parseLibraryBranch({ ...row, Lat: '-79', Long: '43' }), null);
assert.equal(model.parseLibraryBranch({ ...row, BranchCode: '' }), null);
assert.match(model.parseLibraryBranch({ ...row, Hours: null }).hours, /unavailable/);
assert.equal(model.getMapLibraries([branch], null).length, 1);
assert.equal(model.getMapLibraries([branch], branch.coordinate)[0].distanceKm, 0);
assert.equal(model.getMapLibraries([branch], { latitude: 45.5, longitude: -73.5 }).length, 0);
assert.match(model.libraryDescription({ ...branch, distanceKm: 1.5 }), /1515 Albion Road\nMon/);

const createService = (fetcher) => load('src/services/tpl-libraries.ts', {
  '@/data/libraries': model,
  'expo/fetch': { fetch: fetcher },
});
const reply = (records, total = records.length) => ({ ok: true, json: async () => ({ success: true, result: { records, total } }) });
const requests = [];
let fail = false;
const controller = new AbortController();
const service = createService(async (url, options) => {
  requests.push(url);
  assert.equal(options.signal, controller.signal);
  if (fail) throw new Error('Offline');
  const offset = new URL(url).searchParams.get('offset');
  return offset === '0' ? reply([row], 3) : reply([{ ...row }, { ...row, BranchCode: 'B', BranchName: 'Another branch' }], 3);
});
assert.equal(service.getCachedLibraryBranches(), null);
const branches = await service.fetchLibraryBranches(controller.signal);
assert.equal(branches.length, 2, 'Duplicate IDs must not create duplicate markers.');
assert.equal(new URL(requests[1]).searchParams.get('offset'), '1');
assert.equal(branches[0].name, 'Albion');
fail = true;
await assert.rejects(() => service.fetchLibraryBranches(controller.signal), /Offline/);
assert.equal(service.getCachedLibraryBranches(), branches, 'A failed refresh must preserve the last complete result.');
await assert.rejects(() => createService(async () => ({ ok: false })).fetchLibraryBranches(), /unavailable/);
await assert.rejects(() => createService(async () => ({ ok: true, json: async () => ({ success: false }) })).fetchLibraryBranches(), /unexpected/);
await assert.rejects(() => createService(async () => reply([], 1)).fetchLibraryBranches(), /completely/);
await assert.rejects(() => createService(async () => reply([{ ...row, Lat: null }])).fetchLibraryBranches(), /usable/);
assert.equal((await createService(async () => reply([])).fetchLibraryBranches()).length, 0);
console.log('PASS: parsing, physical-branch filtering, coordinates, hours, nearby distances, pagination, deduplication, malformed/failed responses and cache preservation.');

if (process.argv.includes('--live')) {
  const live = await createService(globalThis.fetch).fetchLibraryBranches(AbortSignal.timeout(25000));
  assert(live.length > 0);
  assert.equal(new Set(live.map((item) => item.id)).size, live.length);
  assert(live.every((item) => item.address && item.hours));
  const nearby = model.getMapLibraries(live, { latitude: 43.6532, longitude: -79.3832 });
  assert(nearby.length > 0);
  assert(nearby.every((item) => item.distanceKm <= model.NEARBY_RADIUS_KM));
  assert(nearby.every((item, index) => index === 0 || nearby[index - 1].distanceKm <= item.distanceKm));
  console.log(`PASS: official API returned ${live.length} physical Toronto branches; ${nearby.length} within 5 km of downtown. No cloud writes.`);
}
