insert into policy_documents (id, type, title, last_updated) values
  ('a1000000-0000-0000-0000-000000000001', 'Publishing', 'Publishing Policy', '2026-07-01T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000002', 'Editorial', 'Editorial Board Policy', '2026-07-01T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000003', 'AI', 'Artificial Intelligence Policy', '2026-07-01T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000004', 'Community', 'Community Guidelines', '2026-07-01T12:00:00Z'),
  ('a1000000-0000-0000-0000-000000000005', 'Citation', 'Citation Policy', '2026-07-01T12:00:00Z');

insert into policy_sections (policy_id, title, content, sort_order) values
  ('a1000000-0000-0000-0000-000000000001', 'Writing Focus', 'Adjung prioritizes deliberate, structured submissions of Notes, Essays, and Articles.', 0),
  ('a1000000-0000-0000-0000-000000000001', 'Open Access Charter', 'All publications reside on an open, permanent, decentralized archive for long-term human preservation.', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Double-Blind Review', 'Every essay and article undergoes an independent double-blind review process conducted by the Board of Editors.', 0),
  ('a1000000-0000-0000-0000-000000000003', 'Human Author Integrity', 'Generative AI tools must not be used to draft scholarly content. All manuscripts must represent original human reflection.', 0),
  ('a1000000-0000-0000-0000-000000000004', 'Constructive Disagreement', 'Critique must remain focused on textual arguments, maintaining respect and intellectual integrity.', 0),
  ('a1000000-0000-0000-0000-000000000005', 'Long-term Citation Standards', 'References must include complete titles, publisher records, and permanent DOIs or URLs to guarantee persistent links.', 0);
