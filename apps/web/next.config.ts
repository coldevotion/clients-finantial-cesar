import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@wa/ui', '@wa/types'],
};

export default nextConfig;
