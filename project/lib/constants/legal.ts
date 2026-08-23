/**
 * The legal pages, as data.
 *
 * Written as structured content rather than two hand-built pages so both
 * documents render through the same component and cannot drift in typography,
 * spacing or heading levels. `lastUpdated` lives beside the text it describes,
 * which is the only way it stays honest - a date held in the page template gets
 * bumped when the layout changes and left alone when the wording does.
 */
export interface LegalSection {
	heading: string;
	/** Rendered as paragraphs, in order. */
	body: string[];
	/** Optional bullet list, rendered after the paragraphs. */
	points?: string[];
}

export interface LegalDocument {
	slug: "privacy" | "terms";
	title: string;
	summary: string;
	lastUpdated: string;
	sections: LegalSection[];
}

/**
 * Shown at the top of both documents.
 *
 * This is a capstone project, not a commercial service, and saying so plainly
 * is both the honest thing to do and the useful one: a reader who believes this
 * is a live product will assume guarantees behind it that do not exist.
 */
export const LEGAL_DISCLAIMER =
	"Takda PH is a student capstone project, not a commercial service. This document describes how the application actually behaves, in plain language. It is not legal advice and has not been reviewed by a lawyer.";

const LAST_UPDATED = "23 August 2026";

export const PRIVACY_POLICY: LegalDocument = {
	slug: "privacy",
	title: "Privacy Policy",
	summary:
		"What Takda PH stores about you, why it stores it, who else can see it, and how to get rid of it.",
	lastUpdated: LAST_UPDATED,
	sections: [
		{
			heading: "What we collect",
			body: [
				"Almost everything here is something you typed. There is no advertising, no tracking pixel, and no third-party analytics script following you around.",
			],
			points: [
				"Your account: name, email address and profile image, passed to us by Clerk when you sign in.",
				"Your work: workspaces, projects, boards, tasks, comments, checklists, attachments and the due dates you set.",
				"Your team: who belongs to which workspace and project, and what level of access they hold.",
				"Activity: a record of actions taken in your workspaces, which is what the notifications feed is built from.",
				"Settings: your theme and which email notifications you have turned on.",
			],
		},
		{
			heading: "Who handles your data besides us",
			body: [
				"Takda PH runs on a small number of third-party services. Each one sees only the part of your data it needs to do its job.",
			],
			points: [
				"Clerk handles sign-in and holds your credentials. We never see or store your password.",
				"Neon hosts the PostgreSQL database where your workspace data lives.",
				"Vercel hosts and serves the application.",
				"SendGrid delivers notification and invitation emails, and therefore sees the recipient address and the message.",
				"Upstash stores short-lived counters used to rate-limit requests. It holds no workspace content.",
			],
		},
		{
			heading: "How your data is protected",
			body: [
				"Sensitive free-text content is encrypted before it is written to the database, using AES-256-GCM with a key held only in the server environment. Someone with a copy of the database alone could not read it.",
				"Identifiers such as email addresses are deliberately not encrypted. Encrypting a value that has to be searched or matched requires a scheme that leaks equality anyway, so it would add the appearance of protection without the substance, while breaking search.",
				"Sessions expire 24 hours after you sign in and cannot be extended by staying active.",
			],
		},
		{
			heading: "Who can see your work",
			body: [
				"Access follows membership. You can see a project if you own it, if you were added to it directly, or if you belong to a team that was given access to it. Nobody outside those three routes can reach it, and a project you cannot reach is indistinguishable from one that does not exist.",
				"People in your workspace can see your name, profile image and the activity you generate inside shared projects.",
			],
		},
		{
			heading: "Deleting things",
			body: [
				"Deleting a project or task moves it to the trash, where it stays recoverable for 30 days before being destroyed permanently. Archiving is separate and keeps the item indefinitely.",
				"To remove your account entirely, use the account section in Settings. This is handled through Clerk and removes your sign-in identity; ask a workspace owner to remove your workspace data as well if you want both gone.",
			],
		},
		{
			heading: "Contacting us",
			body: [
				"Use the contact form on the landing page. Messages sent through it are stored so they can be answered, and are forwarded to the person running the project.",
			],
		},
	],
};

export const TERMS_OF_SERVICE: LegalDocument = {
	slug: "terms",
	title: "Terms of Service",
	summary: "What you can expect from Takda PH, and what it expects from you.",
	lastUpdated: LAST_UPDATED,
	sections: [
		{
			heading: "Using the service",
			body: [
				"You need an account to use Takda PH, and you are responsible for what happens under it. Do not share your sign-in credentials.",
				"You must be old enough to agree to these terms in the place where you live.",
			],
		},
		{
			heading: "Your content stays yours",
			body: [
				"The projects, tasks, comments and files you create belong to you and your team. We claim no ownership over them, and we do not use them to train anything.",
				"We store and process that content only to run the features you are using - showing it back to you, sending the notifications you asked for, and keeping it available to the people you shared it with.",
			],
		},
		{
			heading: "What you may not do",
			body: [
				"The rules here are short because the product is small. The point is that other people share these workspaces with you.",
			],
			points: [
				"Do not upload content you have no right to share.",
				"Do not use the invitation system to send unsolicited mail. Invitations are rate-limited for this reason.",
				"Do not attempt to reach workspaces, projects or accounts you were not given access to.",
				"Do not attempt to disrupt the service for other people.",
			],
		},
		{
			heading: "Comment moderation",
			body: [
				"Comments are checked for abusive language. A comment that is flagged is withheld from the thread and placed in a queue for the project's owners, who decide whether to publish or remove it. Its author is notified either way.",
				"The check is automated and imperfect. It can miss things and it can flag things it should not, which is precisely why a person makes the final call rather than the filter.",
			],
		},
		{
			heading: "Availability and limits",
			body: [
				"This is a student project running on free service tiers. It can be slow, it can be interrupted, and it can be taken down. There is no uptime guarantee and no support commitment.",
				"Keep your own copy of anything you would be upset to lose. The 30-day trash window protects you from your own mistakes, not from the service disappearing.",
			],
		},
		{
			heading: "Ending your use",
			body: [
				"You can stop using Takda PH at any time and delete your account from Settings. We may suspend an account that is being used to harm other people on the service.",
			],
		},
		{
			heading: "Changes to these terms",
			body: [
				"If these terms change, the date at the top of this page changes with them. Continuing to use the service after that means you accept the revised version.",
			],
		},
	],
};

export const LEGAL_DOCUMENTS = [PRIVACY_POLICY, TERMS_OF_SERVICE];
