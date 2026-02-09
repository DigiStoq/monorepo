const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory for shared code changes
config.watchFolders = [workspaceRoot];

// Allow importing from parent's node_modules and src/lib
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow importing from src/lib in the parent
config.resolver.extraNodeModules = {
  '@shared': path.resolve(workspaceRoot, 'src/lib'),
};

module.exports = withNativeWind(config, { input: './global.css' });

