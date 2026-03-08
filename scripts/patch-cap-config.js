// Adds local Capacitor plugins to packageClassList after cap sync.
// cap sync regenerates capacitor.config.json and only includes npm-based plugins.
import { readFileSync, writeFileSync } from 'fs';

const LOCAL_PLUGINS = ['TimerAudioPlugin'];
const configPath = 'ios/App/App/capacitor.config.json';

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const list = config.packageClassList || [];

for (const plugin of LOCAL_PLUGINS) {
  if (!list.includes(plugin)) {
    list.push(plugin);
  }
}

config.packageClassList = list;
writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n');
console.log('Patched capacitor.config.json with local plugins:', LOCAL_PLUGINS);
