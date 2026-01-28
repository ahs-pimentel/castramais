/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['typeorm', 'pg', 'reflect-metadata'],
}

module.exports = nextConfig
