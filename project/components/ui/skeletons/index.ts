/**
 * skeleton barrel - centralizes skeleton exports to reduce import noise in
 * `loading.tsx` files, where multiple placeholders are typically required
 * simultaneously.
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
