import path from 'path'
import webpack from 'webpack'
import CopyWebpackPlugin from 'copy-webpack-plugin'

export default {
  mode: 'development',
  context: __dirname,
  devtool: false,
  entry: {
    content: ['./src/content'],
    background: ['./src/background'],
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    publicPath: '/assets/',
    libraryTarget: 'umd',
    clean: true,
  },
  target: ['webworker'],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {from: './manifest.json', to: './'},
        {from: './assets', to: './assets'},
      ],
    }),
    new webpack.ProvidePlugin({
      Buffer: [require.resolve('buffer'), 'Buffer'],
      process: [require.resolve('process/browser')],
      setImmediate: [require.resolve('core-js/features/set-immediate')],
    }),
  ],
}
