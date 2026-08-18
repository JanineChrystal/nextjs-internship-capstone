/**
 * How many root comments one page of a task thread holds.
 *
 * Counted in root comments rather than total rows, because the query always
 * returns every reply belonging to the roots on a page - a reply must never be
 * split from its parent across a page boundary.
 */
export const COMMENTS_PAGE_SIZE = 20;
