import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/ui/legal/legal-document-view";
import { PRIVACY_POLICY } from "@/lib/constants/legal";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: PRIVACY_POLICY.summary,
};

/**
 * public access - ensures the privacy policy is readable without an
 * account, allowing users to review it before signing up.
 */
export default function PrivacyPage() {
	return <LegalDocumentView document={PRIVACY_POLICY} />;
}
