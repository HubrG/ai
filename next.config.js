const path = require("path");
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require("webpack");

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // domains: ["localhost", "res.cloudinary.com", "www.referenseo.com", "daisyui.com", "res.cloudinary.com"],
  },
  webpack: (config) => {
    config.externals = [...config.externals, "bcrypt"];
    return config;
  },

  // webpack: (config, { isServer }) => {
  //   config.experiments = {
  //     asyncWebAssembly: true,
  //     layers: true,
  //   };
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       fs: false,
  //       https: false,
  //     };
  //     config.plugins.push(
  //       new CopyWebpackPlugin({
  //         patterns: [
  //           {
  //             from: path.join(__dirname, 'node_modules', '@dqbd', 'tiktoken', 'lite', 'tiktoken_bg.wasm'),
  //             to: path.join(__dirname, 'public', 'tiktoken_bg.wasm'),
  //           },
  //         ],
  //       })
  //     );
  //   }
  //   return config;
  // },
  // experimental: {
  //   webpackBuildWorker: true,
  // },
};

module.exports = nextConfig;