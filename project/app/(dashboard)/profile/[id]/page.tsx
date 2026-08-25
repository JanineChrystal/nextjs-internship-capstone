import { notFound } from "next/navigation";
import { UserProfileView } from "@/app/(dashboard)/_components/profile/user-profile-view";
import { getUserProfileDAL } from "@/lib/dal/profile";

interface ProfilePageProps {
	params: Promise<{ id: string }>;
}

/**
 * profile page - resolved on the server, because the route is keyed by the
 * database user id while the browser only knows the Clerk id. The previous
 * client version compared the two directly, so "is this me?" was false for
 * everyone and the page rendered a fixture instead of the person in the URL.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
	const { id } = await params;

	const profile = await getUserProfileDAL(id);
	if (!profile) notFound();

	return (
		<UserProfileView
			user={profile.user}
			isSelf={profile.isSelf}
			projects={profile.projects}
		/>
	);
}
