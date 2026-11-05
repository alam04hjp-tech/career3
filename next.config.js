/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  transpilePackages: ['@huggingface/transformers'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
      "sharp": false,
    };
    return config;
  },
};
module.exports = nextConfig;