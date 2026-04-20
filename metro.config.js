// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm asset support
config.resolver.assetExts.push("wasm");

// Ignore optional prebuilt Lightning CSS binaries for non-Windows platforms.
// On some Windows setups Metro may attempt to watch these missing package paths.
const lightningCssNonWindowsBinaries =
  /node_modules[\\/](lightningcss-(darwin|linux|android|freebsd)[^\\/]*)([\\/].*)?$/;

const existingBlockList = config.resolver.blockList;
if (!existingBlockList) {
  config.resolver.blockList = [lightningCssNonWindowsBinaries];
} else if (Array.isArray(existingBlockList)) {
  config.resolver.blockList = [
    ...existingBlockList,
    lightningCssNonWindowsBinaries,
  ];
} else {
  config.resolver.blockList = [
    existingBlockList,
    lightningCssNonWindowsBinaries,
  ];
}

// Add COEP and COOP headers to support SharedArrayBuffer
config.server = config.server ?? {};
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware) => {
  const baseMiddleware = previousEnhanceMiddleware
    ? previousEnhanceMiddleware(middleware)
    : middleware;

  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return baseMiddleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./global.css" });
