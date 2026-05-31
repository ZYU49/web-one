import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: isGitHubPages ? "/web-one" : "",
  assetPrefix: isGitHubPages ? "/web-one/" : "",
  trailingSlash: true,
};

export default nextConfig;
