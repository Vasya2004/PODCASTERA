import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/logo.png",
        search: "",
      },
      {
        pathname: "/api/video/thumbnail",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.userapi.com",
      },
      {
        protocol: "https",
        hostname: "**.vk.com",
      },
      {
        protocol: "https",
        hostname: "**.vkvideo.ru",
      },
      {
        protocol: "https",
        hostname: "**.mycdn.me",
      },
      {
        protocol: "https",
        hostname: "iv.okcdn.ru",
      },
    ],
  },
};

export default nextConfig;
