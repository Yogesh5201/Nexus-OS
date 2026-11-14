/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled: StrictMode double-invokes effects in dev, which makes React
  // Three Fiber mount the WebGL canvas twice and causes background flicker.
  reactStrictMode: false,
  // three.js and related libs ship ESM that benefits from transpilation
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
  webpack: (config) => {
    // Allow importing GLSL-like shader chunks as raw strings if ever needed
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
