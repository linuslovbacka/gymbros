import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Hide the bottom-left “N” dev route indicator in local dev (production never shows it).
  devIndicators: false,
};

export default nextConfig;
