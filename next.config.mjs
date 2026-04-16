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
  webpack: (webpackConfig, { isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Disable cache to prevent OOM
    webpackConfig.cache = false
    
    // Reduce memory pressure
    webpackConfig.optimization = {
      ...webpackConfig.optimization,
      moduleIds: 'deterministic',
      minimize: !isServer, // Only minimize client bundle
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false, // Disable chunking to save memory
    }
    
    // Reduce parallelism
    webpackConfig.parallelism = 1

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
