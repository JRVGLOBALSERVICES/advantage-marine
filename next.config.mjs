/** @type {import('next').NextConfig} */
const nextConfig = {
  // The home route prerenders the R3F rig hero — evaluating the three.js /
  // postprocessing / gsap / motion module graph blows past the default 60s
  // SSG worker limit on cold caches. Give heavy static routes more headroom.
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
