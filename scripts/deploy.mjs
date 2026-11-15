// Publishes dist/ to the gh-pages branch (GitHub Pages serves that branch).
// Usage: npm run deploy
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync } from 'node:fs';

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const remote = execSync('git remote get-url origin').toString().trim();

run('npm run build');
writeFileSync('dist/.nojekyll', '');
if (existsSync('dist/.git')) rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run('git -c user.name="earth-jukebox deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "Deploy"', 'dist');
run(`git push -f -q "${remote}" gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log('Deployed to the gh-pages branch.');
