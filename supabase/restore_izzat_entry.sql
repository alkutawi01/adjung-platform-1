-- Restore Izzat Anas's draft essay, accidentally deleted during testing.
insert into entries (author_id, content_type, status, visibility, title, slug, canonical_url, content, tags, created_date, updated_date, published_date) values ('51525863-2d48-4ed5-b37c-c4299c7a0564', 'Essay', 'Draft', 'Private', 'Untitled Essay', 'untitled-essay-7360', 'http://localhost:3000/essay/user-izzat-anas/untitled-essay-7360', 'This is our essay. Here is a margin note[^mn-1]

[^mn-1]: This is a custom margin note content.', ARRAY[]::text[], '2026-07-12T00:17:37.360Z', '2026-07-12T00:30:48.194Z', NULL);

-- Clean up the test entry created during autosave verification.
delete from entries where id = 'e4b9ea17-67e5-48f7-b1d5-05aba9a9a562';
