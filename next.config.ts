import type { NextConfig } from "next";

// Check environment: GitHub Pages needs /zenexis-online subpath,
// whereas Vercel (zenexis-admin.vercel.app) and local dev run at root /
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const defaultBasePath = isGithubActions ? '/zenexis-online' : '';

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined 
  ? process.env.NEXT_PUBLIC_BASE_PATH 
  : defaultBasePath;

const basePath = rawBasePath && rawBasePath !== '/' 
  ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`) 
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
