const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// shared/platformLegal — isti tekstovi kao web
config.watchFolders = [path.resolve(workspaceRoot, 'shared')];

module.exports = config;
