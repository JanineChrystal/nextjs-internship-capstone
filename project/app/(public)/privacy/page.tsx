import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/ui/legal/legal-document-view";
import { PRIVACY_POLICY } from "@/lib/constants/legal";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: PRIVACY_POLICY.summary,
};

/**
 * Lives in the public group so it is readable without an account - which is the
 * whole point of linking it from the sign-in and sign-up forms. Someone
 * deciding whether to hand over their email must be able to read this first.
 */
export default function PrivacyPage() {
	return <LegalDocumentView document={PRIVACY_POLICY} />;
}
