"use client";

import { useUser } from "@clerk/nextjs";
import { use } from "react";
import { UserProfileView } from "@/app/(dashboard)/_components/profile/user-profile-view";

interface ProfilePageProps {
	params: Promise<{ id: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
	// Resolve params in Next.js 15
	const { id } = use(params);
	const { user: currentUser } = useUser();

	// Determine if viewing own profile or a team member's
	const isSelf = currentUser?.id === id || id === "u1";

	return (
		<UserProfileView
			targetUserId={id}
			viewerUserId={currentUser?.id}
			isSelf={isSelf}
		/>
	);
}
