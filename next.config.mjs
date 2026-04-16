import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
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

    webpackConfig.optimization = {
      ...webpackConfig.optimization,
      moduleIds: 'deterministic',
      splitChunks: isServer ? false : {
        chunks: 'all',
        maxSize: 200000,
      },
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
