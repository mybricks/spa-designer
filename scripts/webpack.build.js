/**
 * XGraph opensource
 * CheMingjun @2019
 * Mail:chemingjun@126.com Wechat:ALJZJZ
 */
const path = require('path');
const webpack = require('webpack')

const merge = require("webpack-merge")
const commonCfg = require('./webpack.common')

module.exports = merge(commonCfg,{
  mode: 'production',
  entry: './src/index.ts',
  output: {
    globalObject: 'this',
    filename: 'index.js',
    path: path.resolve(__dirname, '../dist'),
    libraryTarget: 'umd'
  },
  //devtool: 'cheap-module-source-map',
  //devtool: 'cheap-module-eval-source-map',
  externals: [{
    'React': 'React',
    'react': 'React',
    'react-dom': 'react-dom',
    '@mybricks/rxui': 'rxui',
    'antd': 'antd',
    'blockly': 'Blockly',
    'blocks': 'blocks',
    '@ant-design/icons': '@ant-design',
    'lodash': {commonjs: "lodash", commonjs2: "lodash", amd: "lodash", root: "_"}
  }],
  resolve: {
    alias: {
      '@sdk': require('path').resolve(__dirname, '../src/sdk.ts'),
      '@utils': require('path').resolve(__dirname, '../src/utils/index.ts'),
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.ProvidePlugin({
      'React': 'react'
    })
  ]
})
