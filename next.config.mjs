import CopyPlugin from "copy-webpack-plugin";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(process.cwd(), "node_modules/pdfkit/js/data"),
              to: path.resolve(process.cwd(), ".next/server/vendor-chunks/data"),
            },
            {
              from: path.resolve(process.cwd(), "node_modules/pdfkit/js/data"),
              to: path.resolve(process.cwd(), ".next/server/chunks/data"),
            },
          ],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
