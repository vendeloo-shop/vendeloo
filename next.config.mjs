/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Supabase Storage + portadas externas
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
export default nextConfig;
