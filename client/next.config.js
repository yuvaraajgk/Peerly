/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      // Add your production backend domain here
      // Example for Railway:
      // {
      //   protocol: 'https',
      //   hostname: 'your-app.railway.app',
      //   pathname: '/uploads/**',
      // },
      // Example for Render:
      // {
      //   protocol: 'https',
      //   hostname: 'your-app.onrender.com',
      //   pathname: '/uploads/**',
      // },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
}

module.exports = nextConfig
