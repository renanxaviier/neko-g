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

// Anúncios: ADS_MODE=real gera a versão da loja (AdMob da RX Games); qualquer outro valor = anúncios de teste do Google.
const ADS_MODE = process.env.ADS_MODE === 'real' ? 'real' : 'test';
const ADMOB_APP_ID = ADS_MODE === 'real' ? 'ca-app-pub-6649269264969475~7641906932' : 'ca-app-pub-3940256099942544~3347511713';

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
writeFileSync(join(www, 'src', 'build.js'), `// Gerado por prepare.mjs\nexport const BUILD = { ads: '${ADS_MODE}' };\n`);
console.log(`✔ jogo copiado para www/ (anúncios: ${ADS_MODE === 'real' ? 'REAIS' : 'de teste'})`);

// 2) Projeto nativo (só na primeira vez)
if (!existsSync(join(root, 'android'))) run('npx cap add android');

// 3) AndroidManifest: tela em pé, AdMob
const manifest = join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let xml = readFileSync(manifest, 'utf8');
if (!xml.includes('android:screenOrientation')) {
  xml = xml.replace(/<activity(\s)/, '<activity android:screenOrientation="portrait"$1');
}
xml = xml.replace(/(com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value=")[^"]*"/, `$1${ADMOB_APP_ID}"`);
if (!xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  xml = xml.replace(/<\/application>/, `    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${ADMOB_APP_ID}"/>\n    </application>`);
}
if (!xml.includes('android.permission.VIBRATE')) {             // vibração leve (opção do jogo)
  xml = xml.replace(/<application/, '<uses-permission android:name="android.permission.VIBRATE" />\n    <application');
}
writeFileSync(manifest, xml);
console.log('✔ AndroidManifest ajustado (retrato + AdMob + vibração)');

// 3a) Tela de 90/120 Hz: o WebView costuma ficar preso em 60 Hz se o app não pedir o modo mais rápido.
// MainActivity pede o modo de maior taxa na resolução atual (S25 Ultra etc.) ao abrir e ao voltar ao app.
const pkgDir = join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'nekog', 'game');
const mainAct = join(pkgDir, 'MainActivity.java');
if (existsSync(pkgDir)) {
  writeFileSync(mainAct, `package com.nekog.game;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

// Gerado por android-app/scripts/prepare.mjs (não editar aqui).
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestHighRefreshRate();
    }

    @Override
    public void onResume() {
        super.onResume();
        requestHighRefreshRate();
    }

    // Escolhe o modo de tela com a maior taxa de atualização na mesma resolução.
    private void requestHighRefreshRate() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        try {
            Display d = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ? getDisplay() : getWindowManager().getDefaultDisplay();
            if (d == null) return;
            Display.Mode cur = d.getMode(), best = cur;
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() == cur.getPhysicalWidth() && m.getPhysicalHeight() == cur.getPhysicalHeight()
                        && m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.preferredDisplayModeId = best.getModeId();
            lp.preferredRefreshRate = best.getRefreshRate();
            getWindow().setAttributes(lp);
        } catch (Exception ignored) { }
    }
}
`);
  console.log('✔ MainActivity: pede a maior taxa de tela (90/120 Hz)');
} else console.warn('[aviso] pasta do MainActivity não encontrada: taxa de tela fica no padrão do sistema');

// 3b) Firebase: google-services.json (baixado do Console do Firebase, app Android com.nekog.game).
// O modelo do Capacitor já aplica o plugin do Google Services quando este arquivo existe.
const gsj = join(root, 'google-services.json');
if (existsSync(gsj)) { copyFileSync(gsj, join(root, 'android', 'app', 'google-services.json')); console.log('✔ google-services.json copiado'); }
else console.warn('[aviso] sem android-app/google-services.json: login com Google não vai funcionar no app (veja docs/contas.md)');

// 3c) Login com Google nativo (plugin @capacitor-firebase/authentication): liga o provedor Google no Gradle
const vars = join(root, 'android', 'variables.gradle');
if (existsSync(vars)) {
  let v = readFileSync(vars, 'utf8');
  // Credential Manager recente: as versões antigas falham no Android 16 (ex.: Galaxy S25)
  if (!v.includes('rgcfaIncludeGoogle')) v = v.replace(/ext\s*\{/, "ext {\n    rgcfaIncludeGoogle = true");
  if (/androidxCredentialsVersion\s*=/.test(v)) v = v.replace(/androidxCredentialsVersion\s*=\s*'[^']*'/, "androidxCredentialsVersion = '1.5.0'");
  else v = v.replace(/ext\s*\{/, "ext {\n    androidxCredentialsVersion = '1.5.0'");
  writeFileSync(vars, v);
  console.log('✔ variables.gradle: rgcfaIncludeGoogle = true, androidxCredentialsVersion = 1.5.0');
}

// 3d) Assinatura do APK de teste SEMPRE com android-app/keystore/debug.keystore
// (a SHA-1 dela é a cadastrada no Firebase; com outra chave o login com Google falha com "[16] Account reauth failed")
const appGradle = join(root, 'android', 'app', 'build.gradle');
const ks = join(root, 'keystore', 'debug.keystore');
if (existsSync(appGradle) && existsSync(ks)) {
  let g = readFileSync(appGradle, 'utf8');
  if (!g.includes('nekoDebugKey')) {
    g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        nekoDebugKey {   // gerado por prepare.mjs
            storeFile file('${ks.replace(/\\/g, '/')}')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`);
    g = g.replace(/buildTypes\s*\{/, `buildTypes {
        debug { signingConfig signingConfigs.nekoDebugKey }`);
    writeFileSync(appGradle, g);
  }
  console.log('✔ build.gradle: APK de teste assinado com keystore/debug.keystore');
}

// 4) Ícone e tela de abertura a partir de resources/ (opcional: não para o build se falhar)
try {
  run('npx capacitor-assets generate --android --iconBackgroundColor "#07051a" --splashBackgroundColor "#07051a"');
} catch {
  console.warn('[aviso] não foi possível gerar ícones; o app usará o ícone padrão do Capacitor');
}

// 5) Plugins e arquivos web → projeto Android
run('npx cap sync android');
console.log('\n✔ Pronto. Abra no Android Studio com: npm run open   (ou gere o APK com: cd android && ./gradlew assembleDebug)');
