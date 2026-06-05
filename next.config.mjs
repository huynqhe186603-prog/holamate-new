/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prxagoffeoaggumqojdd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Google user avatars (from Google OAuth)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
