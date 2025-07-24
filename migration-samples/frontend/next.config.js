/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Webpack configuration for handling external libraries
  webpack: (config, { dev, isServer }) => {
    // Handle Vega and D3 modules that might have issues with SSR
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
      }
    }
    
    // Handle specific modules that need special treatment
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      include: /node_modules\/(ag-grid|react-vega|vega|d3)/,
      use: {
        loader: 'next/dist/build/webpack/loaders/next-swc-loader.js',
        options: {
          isServer,
          development: dev,
        }
      }
    })
    
    return config
  },
  
  // Transpile packages that need to be processed
  transpilePackages: [
    'ag-grid-community',
    'ag-grid-react', 
    'ag-grid-enterprise',
    'react-vega',
    'vega',
    'vega-lite',
    'vega-embed',
    'd3',
  ],
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  
  // Rewrites for API proxy (optional, for development)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
        },
      ]
    }
    return []
  },
  
  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors during build (not recommended for production)
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during build (not recommended for production)
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig