import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md belongs to the AI Engineering Kit; Next.js must not append to it.
  agentRules: false,
  // Without this, Turbopack walks up past the repository, finds an unrelated
  // package-lock.json in the parent folder and warns on every build.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
