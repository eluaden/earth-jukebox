// Publishes dist/ to the gh-pages branch (GitHub Pages serves that branch).
// Usage: npm run deploy
//
// Deploy makes a fresh git repo inside dist/, so Angelito scans every file again.
// The NASA data grids are named grid.bin; ExecutablePolicy treats *.bin as Unix
// binaries. The same false-positive exemptions as the main repo (.dlp-ignore.json)
// are written into dist/ with paths relative to that tree before the Deploy commit.
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const remote = execSync('git remote get-url origin').toString().trim();

const DIST_DLP_IGNORE = [
  {
    path: 'tracks/sst/grid.bin',
    policy: 'ExecutablePolicy',
    justification: 'NASA SST data grid (uint8 values), not a Unix executable; .bin is the data extension only',
  },
  {
    path: 'tracks/lightning/grid.bin',
    policy: 'ExecutablePolicy',
    justification: 'NASA lightning data grid (uint8 coverage), not a Unix executable; .bin is the data extension only',
  },
  {
    path: 'tracks/night-lights/grid.bin',
    policy: 'ExecutablePolicy',
    justification: 'NASA night-lights data grid (uint8 brightness), not a Unix executable; .bin is the data extension only',
  },
  {
    path: 'tracks/aerosols/grid.bin',
    policy: 'ExecutablePolicy',
    justification: 'NASA aerosols data grid (uint8 colour strength), not a Unix executable; .bin is the data extension only',
  },
  {
    path: 'tracks/sea-level/grid.bin',
    policy: 'ExecutablePolicy',
    justification: 'NASA sea-level data grid (uint8 ruler reading), not a Unix executable; .bin is the data extension only',
  },
];

run('npm run build');
writeFileSync('dist/.nojekyll', '');
writeFileSync('dist/.dlp-ignore.json', `${JSON.stringify(DIST_DLP_IGNORE, null, 4)}\n`);
if (existsSync('dist/.git')) rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run('git -c user.name="earth-jukebox deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "Deploy"', 'dist');
run(`git push -f -q "${remote}" gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log('Deployed to the gh-pages branch.');
