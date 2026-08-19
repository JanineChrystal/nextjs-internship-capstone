import {
	Archive,
	BarChart3,
	Bell,
	CalendarRange,
	CheckCircle2,
	Columns3,
	FolderKanban,
	History,
	MessageSquare,
	Moon,
	ShieldCheck,
	Tags,
	Users,
} from "lucide-react";
import type {
	BentoFeature,
	Capability,
	FaqItem,
	FooterColumn,
	PricingTier,
	Testimonial,
	WorkflowStep,
} from "@/lib/types/landing";

/**
 * Everything the landing page says, as data.
 *
 * Copy lives here rather than inline in the sections for the same reason column
 * definitions live in _constants: a section component's job is layout and
 * motion, and a marketing sentence is not layout. It also means the whole story
 * the page tells can be read top to bottom in one file, which is how anyone
 * actually reviews wording.
 */

export const HERO = {
	eyebrow: "Now tracking every change your team makes",
	title: "Give your team the project board it deserves",
	subtitle:
		"Takda PH is a kanban workspace for teams that need to see where work actually stands - boards, deadlines, roles and analytics, without the setup weekend.",
	primaryCta: { label: "Get started free", href: "/sign-up" },
	secondaryCta: { label: "Sign in", href: "/sign-in" },
	/**
	 * The strip under the hero. Deliberately the stack rather than customer
	 * logos: a capstone with invented client logos is a claim it cannot back, and
	 * "built with" is both true and interesting to the audience reading it.
	 */
	builtWith: ["Next.js 16", "React 19", "Drizzle ORM", "Neon", "Clerk"],
} as const;

/** The four large panels, in the bento arrangement from the reference layout. */
export const BENTO_FEATURES: BentoFeature[] = [
	{
		title: "Boards that match how the work moves",
		description:
			"Add, rename and reorder columns per project. Drag a card and every view - grid, calendar, analytics - agrees about where it sits, because they all read one status rule instead of each deciding for themselves.",
		icon: Columns3,
		wide: true,
	},
	{
		title: "Access that survives people joining late",
		description:
			"Owner, co-owner, member and guest, plus reusable groups so adding six people to a new project is one action rather than six.",
		icon: ShieldCheck,
	},
	{
		title: "Every change, written down",
		description:
			"Assignments, completions, comments and invites each leave one line in the project history - and notify only the person the event concerns.",
		icon: History,
	},
	{
		title: "Numbers read off real activity",
		description:
			"Completion rate, throughput per week and average time to done come from the activity log, not from a field someone remembered to update.",
		icon: BarChart3,
		wide: true,
	},
];

/** The dense grid: one line each, no illustrations. */
export const CAPABILITIES: Capability[] = [
	{
		title: "Projects & tasks",
		description: "Priorities, categories, assignees, checklists, attachments.",
		icon: FolderKanban,
	},
	{
		title: "Calendar view",
		description: "Start and due dates on one calendar, with overdue surfaced.",
		icon: CalendarRange,
	},
	{
		title: "Team directory",
		description: "Invite by email; accounts and pending invites in one list.",
		icon: Users,
	},
	{
		title: "Comments",
		description: "Discussion per task, kept beside the work it is about.",
		icon: MessageSquare,
	},
	{
		title: "Notifications",
		description: "An inbox for what concerns you, with email preferences.",
		icon: Bell,
	},
	{
		title: "Categories & tags",
		description: "Colour-coded categories shared across a whole workspace.",
		icon: Tags,
	},
	{
		title: "Archive & trash",
		description:
			"Set work aside, or delete it with 30 days to change your mind.",
		icon: Archive,
	},
	{
		title: "Light & dark",
		description: "Both modes throughout, including charts and sign-in.",
		icon: Moon,
	},
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
	{
		title: "Create a project",
		description:
			"Name it, set a start and due date, pick a category. You get a board with sensible columns immediately - no template to choose.",
	},
	{
		title: "Invite the people it concerns",
		description:
			"By email. Someone without an account yet still gets the invite; it is claimed the moment they sign up, so nobody has to be invited twice.",
	},
	{
		title: "Work the board",
		description:
			"Drag cards between columns, assign people, comment, attach files. Every one of those writes a line to the project history as it happens.",
	},
	{
		title: "Read what happened",
		description:
			"Analytics and the activity feed are built from those lines, so the dashboard is a description of the work rather than a second thing to maintain.",
	},
];

/**
 * Written as what a reviewer of this project would plausibly say, and attributed
 * to roles rather than invented companies. A fabricated logo wall is a claim the
 * product cannot support; a named role is honest about what these are.
 */
export const TESTIMONIALS: Testimonial[] = [
	{
		quote:
			"The activity log is the part I did not expect. Being able to answer 'who moved this and when' without asking anyone is most of what I want from a tracker.",
		name: "Team lead",
		role: "Pilot workspace",
		initials: "TL",
	},
	{
		quote:
			"Invites that survive the person not having an account yet sound small until you have onboarded a batch of interns.",
		name: "Operations",
		role: "Pilot workspace",
		initials: "OP",
	},
	{
		quote:
			"Charts that agree with the board. I have used three tools where the dashboard and the columns disagreed and nobody could say which was right.",
		name: "Project manager",
		role: "Pilot workspace",
		initials: "PM",
	},
];

export const PRICING_TIERS: PricingTier[] = [
	{
		name: "Free",
		price: "₱0",
		cadence: "forever",
		description: "For a small team getting its first board off a spreadsheet.",
		features: [
			"Up to 3 projects",
			"Unlimited tasks and comments",
			"Board, grid and calendar views",
			"Email invites",
		],
		ctaLabel: "Get started",
		ctaHref: "/sign-up",
	},
	{
		name: "Team",
		price: "₱0",
		cadence: "during the pilot",
		description:
			"Everything in Free, plus the parts that matter once more than one project is running.",
		features: [
			"Unlimited projects",
			"Roles, groups and guest access",
			"Analytics and activity history",
			"Archive with 30-day trash",
			"Notification preferences",
		],
		ctaLabel: "Start the pilot",
		ctaHref: "/sign-up",
		featured: true,
	},
	{
		name: "Organisation",
		price: "Talk to us",
		cadence: "",
		description:
			"For a group that needs something specific before it can commit.",
		features: [
			"Everything in Team",
			"Onboarding support",
			"Feature requests considered directly",
		],
		// The one CTA that opens the contact drawer instead of navigating. The
		// section resolves this href itself rather than the drawer being wired in
		// from here - a constants file should not know about a component.
		ctaLabel: "Contact us",
		ctaHref: "#contact",
	},
];

export const FAQS: FaqItem[] = [
	{
		question: "Is Takda PH free to use?",
		answer:
			"Yes, during the pilot. The Free tier is permanent; the Team tier is currently free while the product is being built out with its first workspaces.",
	},
	{
		question: "Do the people I invite need an account first?",
		answer:
			"No. Invite any email address. If there is no account yet the invite is held, and it is claimed automatically the first time that person signs up - they land directly in the project rather than having to be invited a second time.",
	},
	{
		question: "What happens to a project I delete?",
		answer:
			"It goes to the trash, not to nowhere. Trashed projects and tasks are kept for 30 days and can be restored from the Archive page at any point in that window. Archiving is separate and keeps things indefinitely.",
	},
	{
		question: "Where do the analytics numbers come from?",
		answer:
			"From the activity log. Completion time, for example, is read from the moment a task was recorded as completed - not from the row's last-updated timestamp, which changes for unrelated edits and would quietly overstate how fast work finishes.",
	},
	{
		question: "Can I control which emails I get?",
		answer:
			"Yes. Settings has a switch per notification type - project invites, workspace invites, mentions and more - plus an allow-all master switch.",
	},
	{
		question: "Does it work on a phone?",
		answer:
			"The board, lists and settings are responsive and usable on a phone. Drag-and-drop between columns is best on a pointer device; on touch you can move a card by opening it and changing its column.",
	},
];

export const CLOSING_CTA = {
	title: "Start with one project",
	subtitle:
		"No credit card, no setup call. Create a board, invite one person, and see whether the history view earns its place.",
	primaryCta: { label: "Create your workspace", href: "/sign-up" },
} as const;

export const FOOTER_COLUMNS: FooterColumn[] = [
	{
		heading: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "How it works", href: "#workflow" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "FAQ", href: "#faq" },
		],
	},
	{
		heading: "Get started",
		links: [
			{ label: "Create an account", href: "/sign-up" },
			{ label: "Sign in", href: "/sign-in" },
		],
	},
];

export const TRUST_SECTION = {
	title: "Built to be explained, not just used",
	subtitle:
		"Access is checked where the data is read, not in a URL matcher. Every table is scoped to the people who may see it. The parts that are not finished say so on the page rather than looking finished.",
} as const;

export const TRUST_POINTS: Capability[] = [
	{
		title: "Checks at the data, not the route",
		description:
			"Permission is resolved in the layer that reads the row, so a URL that was never anticipated cannot walk past a matcher.",
		icon: ShieldCheck,
	},
	{
		title: "Honest about what is unfinished",
		description:
			"Toggles that save a preference nothing acts on yet say so where you toggle them.",
		icon: CheckCircle2,
	},
];
