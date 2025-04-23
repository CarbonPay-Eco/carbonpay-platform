/** @type {import('next').NextConfig} */
const nextConfig = {
	// Removing the "output: export" setting to allow dynamic routes without
	// requiring generateStaticParams() to provide all possible paths
	// This will switch from static site generation to server-side rendering

	// Keep the image optimization setting
	images: {
		unoptimized: true,
	},
	// Skip generating dynamic routes in static export
	// This tells Next.js not to attempt to generate pages for dynamic routes
	trailingSlash: true,
	skipTrailingSlashRedirect: true,
};

export default nextConfig;
