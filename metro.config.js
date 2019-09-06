const {getDefaultConfig} = require("metro-config")

module.exports = (async() => {
  const {resolver: {sourceExts, assetExts}} = await getDefaultConfig()
  return {
    transformer: {
      babelTransformerPath: require.resolve('./metro.transformer.js')
    },
    resolver: {
      assetExts: assetExts,
      sourceExts: [...sourceExts, 'ts', 'tsx']
    }
  }
})()