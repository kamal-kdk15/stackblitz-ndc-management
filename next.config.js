/** @type {import('next').NextConfig} */
const nextConfig = {
	// Keep dev hot-reload files separate from production builds.
	distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};

module.exports = nextConfig;
