const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CompressionPlugin = require("compression-webpack-plugin");
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === "production") {
        // Enable tree shaking
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          usedExports: true,
          splitChunks: {
            chunks: "all",
            minSize: 20000,
            maxSize: 244000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10,
                reuseExistingChunk: true,
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
            },
          },
        };

        // Add compression plugin
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: "[path][base].gz",
            algorithm: "gzip",
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
          })
        );

        // Add bundle analyzer in analyze mode
        if (process.env.ANALYZE) {
          webpackConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: "server",
              analyzerPort: 8888,
            })
          );
        }
      }

      return webpackConfig;
    },
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
    },
  },
};
