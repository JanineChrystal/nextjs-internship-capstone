import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Test configuration.
 *
 * The project had no vitest config at all until now - the first test file
 * happened to import only from its own folder with a relative path, so nothing
 * had needed the `@/` alias yet. The second one did, and failed with "cannot
 * find package '@/lib/constants/contact'", which reads like a missing dependency
 * rather than a missing alias.
 *
 * Vitest does not read `tsconfig.json` paths on its own: TypeScript's `paths` is
 * a type-checking instruction, and the compiler assumes a bundler will do the
 * matching resolution at runtime. Next does that for the app; under vitest there
 * is no Next, so the same mapping has to be declared here.
 *
 * Both aliases from tsconfig are mirrored, in the same order, so a test resolves
 * an import exactly the way the application does.
 */
export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^@\/types\/(.*)$/,
				replacement: `${fileURLToPath(new URL("./lib/types", import.meta.url))}/$1`,
			},
			{
				find: /^@\/(.*)$/,
				replacement: `${fileURLToPath(new URL(".", import.meta.url))}/$1`,
			},
		],
	},
	test: {
		// Node, not jsdom: everything tested so far is pure logic - date maths,
		// aggregation, string escaping. Adding a DOM would slow every run to give
		// these tests something none of them use.
		environment: "node",
		include: ["**/*.test.ts"],
		exclude: ["node_modules/**", ".next/**"],
	},
});
