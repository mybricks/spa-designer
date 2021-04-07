const path = require('path')
const merge = require("webpack-merge")
const commonCfg = require('./webpack.common')

module.exports = merge(commonCfg, {
  entry: path.resolve(__dirname, '../examples/main.js'),
  output: {
    path: path.resolve(__dirname, '../examples'),
    filename: './bundle.js',
    libraryTarget: 'umd'
  },
  externals: [{
    'React': 'React',
    'react': 'React',
    'react-dom': 'ReactDOM',
    // 'rxui': 'rxui',
    '@mybricks/rxui': 'rxui',
    'antd': 'antd',
    'blockly': 'Blockly',
    'blocks': 'blocks',
    '@ant-design/icons': '@ant-design',
    'lodash': {commonjs: "lodash", commonjs2: "lodash", amd: "lodash", root: "_"}
  }],
  devtool: 'cheap-source-map',//devtool: 'cheap-source-map',
  resolve: {
    alias: {
      //'@mybricks/designer': require('path').resolve(__dirname, '../src/index.ts'),
      //'@visualbricks/designer': require('path').resolve(__dirname, '../dist/index.js'),
      '@sdk': require('path').resolve(__dirname, '../src/sdk.ts'),
      '@utils': require('path').resolve(__dirname, '../src/utils/index.ts'),
      '@mybricks/spa-designer': require('path').resolve(__dirname, '../src/index.ts'),
    }
  },
  devServer: {
    port: 8000,
    contentBase: path.join(__dirname, '../examples'),
    disableHostCheck: true,
    //progress: true,
    inline: true
  },
  //plugins:[devFlagPlugin]
})