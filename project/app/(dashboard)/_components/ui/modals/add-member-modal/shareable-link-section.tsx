import { Copy, RefreshCw } from "lucide-react";
import { DEFAULT_SHARE_ROLE_OPTIONS } from "@/app/(dashboard)/_constants/add-member-modal";
import { Button } from "@/components/ui/buttons/button";
import type { ShareLinkConfig } from "@/types/member";

interface ShareableLinkSectionProps {
	shareUrl: string;
	shareLinkConfig?: ShareLinkConfig;
	onCopyLink: () => void;
	onRegenerateToken: () => void;
	onUpdateDefaultRole: (role: "member" | "guest") => void;
}

export function ShareableLinkSection({
	shareUrl,
	shareLinkConfig,
	onCopyLink,
	onRegenerateToken,
	onUpdateDefaultRole,
}: ShareableLinkSectionProps) {
	return (
		<div className="flex flex-col gap-3">
			<div>
				<h4 className="text-sm font-semibold text-on-surface mb-1">
					Public Shareable Link
				</h4>
				<p className="text-xs text-secondary mb-3">
					Select default access level for anyone who opens this link.
				</p>
			</div>

			<div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-lg border border-outline-variant">
				<label htmlFor="defaultShareRole" className="sr-only">
					Default Share Role
				</label>
				<select
					id="defaultShareRole"
					value={shareLinkConfig?.defaultRole || "member"}
					onChange={(e) =>
						onUpdateDefaultRole(e.target.value as "member" | "guest")
					}
					className="h-10 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-md text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
				>
					{DEFAULT_SHARE_ROLE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md px-3 h-10 flex items-center overflow-hidden w-full">
					<span className="text-sm text-secondary truncate">
						{shareUrl || "Generate a link..."}
					</span>
				</div>

				<div className="flex gap-2 w-full sm:w-auto">
					<Button
						type="button"
						variant="outline"
						onClick={onCopyLink}
						className="flex-1 sm:flex-none border-outline-variant text-on-surface"
					>
						<Copy size={16} className="mr-2 text-secondary" />
						Copy
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={onRegenerateToken}
						className="flex-1 sm:flex-none border-outline-variant text-on-surface"
						title="Regenerate link"
					>
						<RefreshCw size={16} className="text-secondary" />
					</Button>
				</div>
			</div>
		</div>
	);
}
