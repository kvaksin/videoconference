const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Find the ForkTsCheckerWebpackPlugin
      const forkTsCheckerWebpackPluginIndex = webpackConfig.plugins.findIndex(
        (plugin) => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );

      if (forkTsCheckerWebpackPluginIndex !== -1) {
        // Remove the existing plugin
        webpackConfig.plugins.splice(forkTsCheckerWebpackPluginIndex, 1);
        
        // Add it back with custom configuration
        const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
        webpackConfig.plugins.push(
          new ForkTsCheckerWebpackPlugin({
            async: env === 'development',
            typescript: {
              typescriptPath: require.resolve('typescript'),
              configOverwrite: {
                compilerOptions: {
                  sourceMap: env === 'development',
                  skipLibCheck: true,
                  incremental: true,
                  tsBuildInfoFile: path.resolve(paths.appPath, 'node_modules/.cache/tsconfig.tsbuildinfo'),
                }
              },
              context: paths.appPath,
              diagnosticOptions: {
                syntactic: true,
                semantic: true,
                declaration: false,
                global: false,
              },
              mode: 'write-references',
              // Memory limit moved to typescript options
              memoryLimit: 4096,
            },
            issue: {
              include: [
                { file: '../**/src/**/*.{ts,tsx}' },
                { file: '**/src/**/*.{ts,tsx}' }
              ],
              exclude: [
                { file: '**/src/**/__tests__/**' },
                { file: '**/src/**/?(*.){spec|test}.*' },
                { file: '**/src/setupProxy.*' },
                { file: '**/src/setupTests.*' }
              ]
            },
            logger: 'webpack-infrastructure',
          })
        );
      }

      // Optimize webpack for large projects
      if (env === 'development') {
        // Disable source maps for node_modules to save memory
        webpackConfig.module.rules.forEach(rule => {
          if (rule.oneOf) {
            rule.oneOf.forEach(oneOfRule => {
              if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
                oneOfRule.use.forEach(useRule => {
                  if (typeof useRule === 'object' && useRule.loader && useRule.loader.includes('source-map-loader')) {
                    useRule.exclude = [/node_modules/];
                  }
                });
              }
            });
          }
        });

        // Optimize cache
        webpackConfig.cache = {
          type: 'filesystem',
          cacheDirectory: path.resolve(paths.appPath, 'node_modules/.cache/webpack'),
          buildDependencies: {
            config: [__filename]
          }
        };

        // Reduce memory usage for development
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
      }

      return webpackConfig;
    },
  },
  devServer: {
    // Reduce memory usage
    compress: false,
    // Disable hot reloading for heavy files
    hot: true,
    liveReload: false,
  },
  // TypeScript configuration
  typescript: {
    enableTypeChecking: true,
  },
};