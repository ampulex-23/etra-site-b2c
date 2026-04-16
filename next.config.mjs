import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Memory optimization for build
  productionBrowserSourceMaps: false,
  swcMinify: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable static generation - render everything at runtime
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: '/info',
        destination: '/landing.html',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.twcstorage.ru',
      },
      {
        protocol: 'https',
        hostname: '*.twc1.net',
      },
      {
        protocol: 'https',
        hostname: 'etraproject.ru',
      },
      {
        protocol: 'http',
        hostname: 'etraproject.ru',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 't.me',
      },
      {
        protocol: 'https',
        hostname: '*.telegram.org',
      },
      {
        protocol: 'https',
        hostname: 'cdn*.telegram.org',
      },
    ],
  },
  webpack: (webpackConfig, { isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Reduce memory usage
    webpackConfig.cache = false
    
    // Optimize Three.js - only include what we need
    if (!isServer) {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'three': 'three/src/Three.js',
      }
    }

    webpackConfig.optimization = {
      ...webpackConfig.optimization,
      moduleIds: 'deterministic',
      minimize: true,
      splitChunks: isServer ? false : {
        chunks: 'all',
        maxSize: 200000,
        cacheGroups: {
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three-vendor',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
