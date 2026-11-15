// Downloads the NASA SVS reference videos inspected in docs/recursos-do-desafio.md (section 3.11)
// into sources/, which git ignores: GitHub rejects files over 100 MB, and these are 33 to 334 MB.
// A file already present with the expected size is skipped, so the script can be re-run.
// Usage: npm run fetch-sources              (all videos)
//        npm run fetch-sources -- <name>... (only these; names listed by --list)
//        npm run fetch-sources -- --list
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DIR = 'sources';
const BASE = 'https://svs.gsfc.nasa.gov/vis/a000000';
const VIDEOS = [
  { name: 'night-lights', svs: 5313, path: 'a005300/a005313/nightlights_flat_series_and_change_wZooms_13_EIC_2160p30_h265.mp4', bytes: 34306797 },
  { name: 'sea-surface-temperature', svs: 3912, path: 'a003900/a003912/ecco2_sst_flow.mp4', bytes: 256266335 },
  { name: 'air-quality-eic', svs: 5533, path: 'a005500/a005533/EIC_AirQuality_Preview_3840x1080.mp4', bytes: 187482511 },
  { name: 'lightning-sphere', svs: 5011, path: 'a005000/a005011/iss_lightning_sphere_07312023.mp4', bytes: 133203670 },
  { name: 'lightning-flat', svs: 5011, path: 'a005000/a005011/iss_lightning_sos_yearly_07312023_2048p60.mp4', bytes: 350207237 },
];

const mb = (n) => `${(n / 2 ** 20).toFixed(1)} MB`;
const fileOf = (v) => `${DIR}/${v.svs}-${v.path.split('/').pop()}`;

const args = process.argv.slice(2);
if (args.includes('--list')) {
  for (const v of VIDEOS) console.log(`${v.name.padEnd(24)} SVS ${v.svs}  ${mb(v.bytes).padStart(9)}  ${fileOf(v)}`);
  process.exit(0);
}
const unknown = args.filter((a) => !VIDEOS.some((v) => v.name === a));
if (unknown.length) {
  console.error(`Unknown video(s): ${unknown.join(', ')}. Run with --list to see the names.`);
  process.exit(1);
}
const wanted = args.length ? VIDEOS.filter((v) => args.includes(v.name)) : VIDEOS;

mkdirSync(DIR, { recursive: true });
for (const v of wanted) {
  const file = fileOf(v);
  if (existsSync(file) && statSync(file).size === v.bytes) {
    console.log(`ok    ${file}`);
    continue;
  }
  const url = `${BASE}/${v.path}`;
  console.log(`get   ${file} (${mb(v.bytes)}) from ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(`${file}.part`));
  const size = statSync(`${file}.part`).size;
  if (size !== v.bytes) throw new Error(`${url}: got ${size} bytes, expected ${v.bytes}. The file on SVS may have changed; partial download left at ${file}.part`);
  renameSync(`${file}.part`, file);
}
console.log(`Done: ${wanted.length} video(s) in ${DIR}/.`);
