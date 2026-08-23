import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/ui/legal/legal-document-view";
import { TERMS_OF_SERVICE } from "@/lib/constants/legal";

export const metadata: Metadata = {
	title: "Terms of Service",
	description: TERMS_OF_SERVICE.summary,
};

export default function TermsPage() {
	return <LegalDocumentView document={TERMS_OF_SERVICE} />;
}
