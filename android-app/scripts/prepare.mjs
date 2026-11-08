// Prepara o projeto Android: copia o jogo (../web) para www/, cria a pasta android/ na primeira vez,
// ajusta o AndroidManifest (retrato + AdMob) e sincroniza os plugins.
// Uso: npm run prepare:android
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, '..', 'web');
const www = join(root, 'www');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });

// ID do app AdMob. Este é o ID de TESTE oficial do Google; troque pelo seu antes de publicar.
const ADMOB_APP_ID = process.env.ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713';

// 1) Jogo → www/
rmSync(www, { recursive: true, force: true });
cpSync(web, www, { recursive: true });

// Núcleo do Capacitor sem bundler: dá ao jogo o registerPlugin() (window.capacitorExports)
const core = join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js');
if (existsSync(core)) {
  copyFileSync(core, join(www, 'capacitor-core.js'));
  const idx = join(www, 'index.html');
  const html = readFileSync(idx, 'utf8').replace('<script type="module"', '<script src="capacitor-core.js"></script>\n<script type="module"');
  writeFileSync(idx, html);
} else {
  console.warn('[aviso] @capacitor/core/dist/capacitor.js não encontrado: o jogo usará window.Capacitor.Plugins');
}
console.log('✔ jogo copiado para www/');

// 2) Projeto nativo (só na primeira vez)
if (!existsSync(join(root, 'android'))) run('npx cap add android');

// 3) AndroidManifest: tela em pé, AdMob
const manifest = join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let xml = readFileSync(manifest, 'utf8');
if (!xml.includes('android:screenOrientation')) {
  xml = xml.replace(/<activity(\s)/, '<activity android:screenOrientation="portrait"$1');
}
if (!xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  xml = xml.replace(/<\/application>/, `    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${ADMOB_APP_ID}"/>\n    </application>`);
}
writeFileSync(manifest, xml);
console.log('✔ AndroidManifest ajustado (retrato + AdMob)');

// 3b) Firebase: google-services.json (baixado do Console do Firebase, app Android com.nekog.game).
// O modelo do Capacitor já aplica o plugin do Google Services quando este arquivo existe.
const gsj = join(root, 'google-services.json');
if (existsSync(gsj)) { copyFileSync(gsj, join(root, 'android', 'app', 'google-services.json')); console.log('✔ google-services.json copiado'); }
else console.warn('[aviso] sem android-app/google-services.json: login com Google não vai funcionar no app (veja docs/contas.md)');

// 4) Ícone e tela de abertura a partir de resources/ (opcional: não para o build se falhar)
try {
  run('npx capacitor-assets generate --android --iconBackgroundColor "#07051a" --splashBackgroundColor "#07051a"');
} catch {
  console.warn('[aviso] não foi possível gerar ícones; o app usará o ícone padrão do Capacitor');
}

// 5) Plugins e arquivos web → projeto Android
run('npx cap sync android');
console.log('\n✔ Pronto. Abra no Android Studio com: npm run open   (ou gere o APK com: cd android && ./gradlew assembleDebug)');
