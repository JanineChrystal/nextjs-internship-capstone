/**
 * The skeleton primitives, in one import.
 *
 * A barrel here because a `loading.tsx` typically needs three or four of these
 * at once - a page frame, a stat row and a grid - and four separate import
 * lines per file across nine route loading states is noise that hides which
 * skeleton a page actually uses.
 */
export { SkeletonAvatar, SkeletonAvatarList } from "./avatar";
export { SkeletonCard, SkeletonCardGrid } from "./card";
export { SkeletonList, SkeletonListRow } from "./list";
export {
	SkeletonChartCard,
	SkeletonPage,
	SkeletonPageHeader,
	SkeletonStatGrid,
} from "./page";
export { SkeletonTable } from "./table";
export { SkeletonText } from "./text";
