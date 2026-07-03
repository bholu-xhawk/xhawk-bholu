const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv && argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    target: 'web',
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      assetModuleFilename: 'assets/[hash][ext][query]',
    },
    module: {
      rules: [


        {
          test: /\.(png|jpe?g|gif|svg|ico|webp|avif|eot|ttf|woff2?)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public', 'index.html'),
      }),
    ],
    devtool: isProd ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
      port: 8080,
      open: false,
      hot: true,
      compress: true,
      client: {
        overlay: true,
      },
    },
  };
};
