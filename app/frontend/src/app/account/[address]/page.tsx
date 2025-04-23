import AccountDetailFeature from "@/components/account/account-detail-feature";

// This function is required for static exports with dynamic routes
export function generateStaticParams() {
	// For static export, we need to pre-define the possible paths
	// Since wallet addresses are dynamic and can't be known at build time,
	// we'll return an empty array and handle this client-side
	return [];
}

export default function AccountDetailPage() {
	return <AccountDetailFeature />;
}
