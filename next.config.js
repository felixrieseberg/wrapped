/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'emoji.slack-edge.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
