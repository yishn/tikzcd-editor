const path = require('path')

module.exports = (env, argv) => ({
  entry: './src/index.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname)
  },

  devtool:
    argv.mode === 'production' ? 'source-map' : 'cheap-module-eval-source-map',

  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  modules: false,
                  targets: '> 4%'
                }
              ]
            ],
            plugins: [
              [
                '@babel/plugin-proposal-class-properties',
                {
                  loose: true
                }
              ],
              [
                '@babel/transform-react-jsx',
                {
                  pragma: 'h',
                  pragmaFrag: 'Fragment'
                }
              ]
            ]
          }
        }
      }
    ]
  },

  resolve: {
    alias: {
      preact:
        argv.mode === 'production'
          ? path.join(__dirname, 'node_modules/preact/dist/preact.min')
          : 'preact'
    }
  }
})
