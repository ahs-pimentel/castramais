/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['typeorm', 'pg'],
}

module.exports = nextConfig
