const nativeTransformer = require('metro-react-native-babel-transformer/src/index')
const typescriptTransformer = require('react-native-typescript-transformer')

module.exports.transform = ({src, filename, options}) => {
  if(filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    return typescriptTransformer.transform({src, filename, options})
  } else {
    return nativeTransformer.transform({src, filename, options})
  }
}