import {
	Body,
	Container,
	Head,
	Html,
	Preview,
	Tailwind,
} from "@react-email/components";
import type * as React from "react";

interface EmailLayoutProps {
	previewText: string;
	children: React.ReactNode;
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								primary: "#2563eb", // Using a stable brand color fallback
							},
						},
					},
				}}
			>
				<Body className="bg-white font-sans">
					<Container className="mx-auto my-[40px] max-w-[600px] p-[20px] rounded border border-solid border-[#eaeaea]">
						<div className="flex items-center gap-2 mb-6">
							{/* We can't use absolute paths for the logo unless hosted, so we use text as fallback for now */}
							<span className="text-xl font-bold tracking-tight text-slate-900">
								Project Manager
							</span>
						</div>
						{children}
						<div className="mt-8 border-t border-solid border-[#eaeaea] pt-6 text-sm text-[#666666]">
							<p>
								You received this email because of your notification settings.
								You can update them at any time in your Dashboard Settings.
							</p>
						</div>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
