/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permet au service worker d'être servi depuis /public
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    },
  ],
};

module.exports = nextConfig;
