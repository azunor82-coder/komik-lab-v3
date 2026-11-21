// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK's ES-module build has circular imports that throw
// "Cannot access '...' before initialization" under Metro's live-binding import
// transform (seen in development builds). Its CommonJS build is equivalent and
// loads cleanly, so resolve the SDK entry points to that build on every platform.
const SDK = '@anthropic-ai/sdk';
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === SDK || moduleName.startsWith(`${SDK}/`)) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName) };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
