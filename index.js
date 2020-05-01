'use strict';
const {systemPreferences} = require('electron');
const execa = require('execa');
const {isAppRunning, terminateApp, launchApp} = require('macos-manage-apps');

const readDefaults = async () => {
  const {stdout} = await execa('defaults', ['read', 'com.apple.systemuiserver', 'menuExtras']);
  return stdout;
};

const writeDefaults = async defaults => {
  await execa('defaults', ['write', 'com.apple.systemuiserver', 'menuExtras', defaults]);
  await execa('killall', ['SystemUIServer']);
};

const willStartRecording = async ({state}) => {
  const defaults = await readDefaults();
  systemPreferences.postNotification('com.wulkano.kap.hideclock.willStartRecording', {});

  if (defaults.includes('Clock.menu')) {
    state.defaults = defaults;

    const defaultsWithoutClock = defaults
      .split('\n')
      .filter(line => !line.includes('Clock.menu'))
      .join('\n');

    await writeDefaults(defaultsWithoutClock);
	}

	state.wasDatoRunning = await isAppRunning('com.sindresorhus.Dato');
	if (state.wasDatoRunning) {
		await terminateApp('com.sindresorhus.Dato');
	}
};

const didStopRecording = async ({state}) => {
	systemPreferences.postNotification('com.wulkano.kap.hideclock.didStopRecording', {});

	if (state.wasDatoRunning) {
		await launchApp('com.sindresorhus.Dato');
  }

  if (state.defaults) {
    await writeDefaults(state.defaults);
  }
};

const hideClock = {
  title: 'Hide Clock',
  willStartRecording,
  didStopRecording
};

exports.recordServices = [hideClock];
