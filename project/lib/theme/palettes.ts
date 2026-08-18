import type { ThemePalette } from "@/lib/types/theme";

/**
 * The twelve colour themes, each as six swatches from darkest to lightest.
 *
 * This file is data only - nothing here reads or writes a theme. Phase 7 adds
 * the generator that turns each row into the full set of CSS custom properties
 * for light and dark, and the picker that applies one. Keeping the data in place
 * first means that phase is a pure addition rather than a rewrite, and it lets
 * the swatches be reviewed on screen now, while changing one is still free.
 *
 * Where a source reference had fewer than six swatches, the missing steps were
 * interpolated so every palette has the same shape. Three needed more than
 * interpolation, and each of those decisions is recorded on the palette itself
 * rather than in a commit message nobody will find later.
 */
export const THEME_PALETTES: ThemePalette[] = [
	{
		id: "sunrise",
		name: "Sunrise",
		swatches: [
			"#CD8B09",
			"#E9A413",
			"#FCC724",
			"#FEF36C",
			"#FDFEAD",
			"#FDFBD5",
		],
	},
	{
		id: "dark-forest",
		name: "Dark Forest",
		// Reordered to run dark to light. The source image listed its largest
		// swatch last regardless of value, which put a mid grey after the two
		// lightest ones - fine as a poster, wrong as a ramp.
		swatches: [
			"#0D1F23",
			"#132E35",
			"#2D4A53",
			"#5A636A",
			"#69818D",
			"#AFB3B7",
		],
	},
	{
		id: "ocean",
		name: "Ocean",
		// One step interpolated between #052659 and #5483B3.
		swatches: [
			"#021024",
			"#052659",
			"#2D5486",
			"#5483B3",
			"#7DA0CA",
			"#C1E8FF",
		],
	},
	{
		id: "berry",
		name: "Berry",
		// One step interpolated between #A56ABD and #E7DBEF.
		swatches: [
			"#49225B",
			"#6E3482",
			"#A56ABD",
			"#C6A2D6",
			"#E7DBEF",
			"#F5EBFA",
		],
	},
	{
		id: "dark-berry",
		name: "Dark Berry",
		swatches: [
			"#190019",
			"#2B124C",
			"#522B5B",
			"#854F6C",
			"#DFB6B2",
			"#FBE4D8",
		],
	},
	{
		id: "cloud-berry",
		name: "Cloud Berry",
		// The two source images for Dark Berry and Cloud Berry carried identical
		// hex codes. Treated as a mistake rather than as two names for one theme:
		// this is a lighter, softer reading of the same violet-mauve family, so
		// the two are actually distinguishable side by side in the picker.
		swatches: [
			"#2E1A33",
			"#4A2F52",
			"#6B4E6E",
			"#9B7A93",
			"#D9C3D2",
			"#F2E8EE",
		],
	},
	{
		id: "forest",
		name: "Forest",
		// One step interpolated between #6B9071 and #AEC3B0.
		swatches: [
			"#0F2A1D",
			"#375534",
			"#6B9071",
			"#8EAA90",
			"#AEC3B0",
			"#E3EED4",
		],
	},
	{
		id: "cherry",
		name: "Cherry",
		// Two steps interpolated - the source jumped straight from dark maroon to
		// tan with nothing in between, which would have left a visible break.
		swatches: [
			"#561C24",
			"#6D2932",
			"#8B5858",
			"#A9887D",
			"#C7B7A3",
			"#E8D8C4",
		],
	},
	{
		id: "dark-cherry",
		name: "Dark Cherry",
		// Rebuilt. The source was a brand sheet - one red at three opacities plus
		// pure white and black - which is not a ramp and could not be interpolated
		// into one. This is a genuine six-step ramp anchored on that red, #DF2531.
		swatches: [
			"#1A0505",
			"#3D0B0E",
			"#6B1319",
			"#A11B22",
			"#DF2531",
			"#F2A8AD",
		],
	},
	{
		id: "sunset",
		name: "Sunset",
		// The source had four swatches, all light to mid, so a dark anchor was
		// added at the bottom and one step interpolated near the top.
		swatches: [
			"#A83E0D",
			"#EA6113",
			"#F88F22",
			"#FBB931",
			"#FDD073",
			"#FFE3B3",
		],
	},
	{
		id: "default",
		name: "Default",
		// Built from the blues already live in globals.css, NOT from the brown
		// image labelled "Default" in the references. Picking the theme called
		// Default has to be the one choice that changes nothing - if it repainted
		// the app it would be the most disruptive option in the list, which is
		// backwards. The brown palette is below, under its own name.
		swatches: [
			"#001945",
			"#003178",
			"#0D47A1",
			"#2B5BB5",
			"#7DA5E8",
			"#B0C6FF",
		],
	},
	{
		id: "mocha",
		name: "Mocha",
		// The brown palette from the reference sheet labelled "Default", renamed so
		// it can coexist with the app's real default. One step interpolated.
		swatches: [
			"#291C0E",
			"#4C3225",
			"#6E473B",
			"#A78D78",
			"#BEB5A9",
			"#E1D4C2",
		],
	},
];

/** The theme in force today, and the one the picker shows as selected. */
export const DEFAULT_PALETTE_ID = "default";
