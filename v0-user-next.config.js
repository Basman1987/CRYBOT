/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "utf-8-validate": "commonjs utf-8-validate",
        bufferutil: "commonjs bufferutil",
        "zlib-sync": "commonjs zlib-sync",
      })
    }
    return config
  },
}

module.exports = nextConfig

