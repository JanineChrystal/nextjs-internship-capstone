/**
 * Stands in for `server-only` when tests run.
 *
 * That package exists to make importing a server module from a client bundle a
 * build error. It does that by resolving to a module that throws unless the
 * bundler sets React's "react-server" condition - which Next does and vitest
 * does not, so a test importing anything marked server-only fails to resolve it
 * at all.
 *
 * Aliasing it to nothing lets a server module's *pure* exports be unit tested -
 * response parsers, formatters - without weakening the guarantee in the real
 * build, where the genuine package is still what gets resolved.
 */
export {};
