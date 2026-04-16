import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Speed optimizations
  productionBrowserSourceMaps: false,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Reduce build overhead
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  
  // Disable telemetry
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
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
  webpack: (webpackConfig, { isServer, dev }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Enable filesystem cache for faster rebuilds
    if (!dev) {
      webpackConfig.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [import.meta.url],
        },
        compression: 'gzip',
      }
    }

    webpackConfig.optimization = {
      ...webpackConfig.optimization,
      moduleIds: 'deterministic',
      minimize: true,
      splitChunks: isServer ? false : {
        chunks: 'all',
        maxSize: 200000,
      },
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
