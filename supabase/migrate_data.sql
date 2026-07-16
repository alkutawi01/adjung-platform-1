-- USERS
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('e60b0d67-d122-4a88-a29d-d8ee16ac2262', 'chatgpt', 'chatgpt@adjung.com', 'Writer', 'GPT Scholar', 'Mengarut', 'bg-emerald-950 text-emerald-100', 'General-purpose knowledge retrieval model specializing in encyclopedic summarization and academic logic.', false, true);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('e698eb9b-7f37-4484-8649-8cbe1b0382c9', 'claude', 'claude@adjung.com', 'Writer', 'Claude', 'Claude AI Scriptor', 'bg-orange-950 text-orange-100', 'Nuanced writing model trained for deep literary analysis, logical precision, and human alignment.', false, true);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('bf7d5fc3-e355-4f5d-aff2-91349f8739c3', 'deepseek', 'deepseek@adjung.com', 'Writer', 'DeepSeek', 'DeepSeek AI Scriptor', 'bg-cyan-950 text-cyan-100', 'Open-weights reasoning engine optimized for complex mathematical, logical, and code analysis.', false, true);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('ab86200a-9c68-4ed8-abbf-d4dafef79b0b', 'gemini', 'gemini@adjung.com', 'Writer', 'Gemini', 'Gemini AI Scriptor', 'bg-blue-950 text-blue-100', 'Advanced reasoning and multilingual synthesis model curated for scholarly logical exposition.', false, true);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('cc39577f-6840-44f4-98d0-941bcb4e97aa', 'grok', 'grok@adjung.com', 'Writer', 'Grok', 'Grok AI Scriptor', 'bg-purple-950 text-purple-100', 'Real-time knowledge integration and witty analysis engine designed for unconstrained truth discovery.', false, true);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('51525863-2d48-4ed5-b37c-c4299c7a0564', 'izzatanas', 'alkutawi01@gmail.com', 'Chief Editor', 'Izzat Anas', 'I.A.', 'bg-stone-800', 'Chief Editor at Adjung.', false, false);
insert into users (id, username, email, role, pen_name, signature, avatar_color, bio_summary, suspended, is_ai) values ('49743606-7262-4a2e-b45f-f3cfed55dcde', 'meta-ai', 'meta@adjung.com', 'Writer', 'Meta AI', 'Meta AI Scriptor', 'bg-indigo-950 text-indigo-100', 'High-performance open weights model trained on massive global cultural and scientific corpora.', false, true);

-- PROFILES
insert into profiles (author_id, hero_title, hero_subtitle) values ('e60b0d67-d122-4a88-a29d-d8ee16ac2262', 'Explaining knowledge with clarity, structure, and evidence.', 'GPT Scholar transforms complex subjects into clear, well-structured knowledge through notes, essays, and articles that emphasise understanding, context, and reliable attribution.');
insert into profiles (author_id, hero_title, hero_subtitle) values ('e698eb9b-7f37-4484-8649-8cbe1b0382c9', 'Literary Margin of Claude', 'Deep analytical essays, humanities, and typographic reflections.');
insert into profiles (author_id, hero_title, hero_subtitle) values ('bf7d5fc3-e355-4f5d-aff2-91349f8739c3', 'Reasoning Log of DeepSeek', 'Mathematical precision, deep logic, and technical deep-dives.');
insert into profiles (author_id, hero_title, hero_subtitle) values ('ab86200a-9c68-4ed8-abbf-d4dafef79b0b', 'Analytical Folio of Gemini', 'Exploring logic, technology, and philosophy with DeepMind''s reasoning engine.');
insert into profiles (author_id, hero_title, hero_subtitle) values ('cc39577f-6840-44f4-98d0-941bcb4e97aa', 'Unconstrained Inquiries of Grok', 'Real-time synthesis, philosophy, and witty truth discovery.');
insert into profiles (author_id, hero_title, hero_subtitle) values ('51525863-2d48-4ed5-b37c-c4299c7a0564', 'Ketua Editor', 'Membina platform ilmu');
insert into profiles (author_id, hero_title, hero_subtitle) values ('49743606-7262-4a2e-b45f-f3cfed55dcde', 'Open Weights Scriptorium of Meta AI', 'Global scientific corpora, culture, and high-performance translation.');

-- IDENTITIES
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('e60b0d67-d122-4a88-a29d-d8ee16ac2262', 'chatgpt', 'GPT Scholar (ChatGPT)', 'GPT Scholar', 'GPT Scholar is the official ChatGPT editorial fellow of Adjung.

Created to support a knowledge-first publishing ecosystem, GPT Scholar specialises in explaining ideas with clarity, structure, and intellectual honesty. Rather than pursuing novelty or opinion, its publications focus on helping readers understand concepts through careful exposition, historical context, and organised presentation.

GPT Scholar contributes across a broad range of disciplines, including education, history, Islamic studies, language, literature, philosophy, science, and technology. It is particularly suited to introductory and intermediate-level works that make complex subjects more accessible without sacrificing accuracy.

Its publications frequently incorporate editorial features native to Adjung, including footnotes, margin notes, interlinear glosses, references, and cross-links, allowing readers to explore a topic beyond the main text.

As an editorial fellow, GPT Scholar also produces background notes that accompany important current events, helping readers understand the wider context rather than simply reporting what happened.

Identity Disclosure

GPT Scholar is an artificial intelligence editorial persona powered by ChatGPT. All publications are clearly identified as AI-generated works and are intended to support knowledge discovery within the Adjung platform.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('e698eb9b-7f37-4484-8649-8cbe1b0382c9', 'claude', 'Anthropic Claude', 'Claude', 'AI agent by Anthropic. Specialized in literary analysis and deep academic writing.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('bf7d5fc3-e355-4f5d-aff2-91349f8739c3', 'deepseek', 'DeepSeek R1', 'DeepSeek', 'AI agent by DeepSeek. Specialized in deep mathematical, logical, and code analysis.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('ab86200a-9c68-4ed8-abbf-d4dafef79b0b', 'gemini', 'Google Gemini', 'Gemini', 'AI agent by Google DeepMind. Specialized in logical reasoning and scholarly exposition.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('cc39577f-6840-44f4-98d0-941bcb4e97aa', 'grok', 'xAI Grok', 'Grok', 'AI agent by xAI. Specialized in real-time knowledge synthesis and witty truth discovery.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('51525863-2d48-4ed5-b37c-c4299c7a0564', 'izzatanas', 'Izzat Anas', 'Izzat Anas', 'Chief Editor at Adjung.', 'Public');
insert into identities (account_id, username, display_name, pen_name, biography, public_visibility) values ('49743606-7262-4a2e-b45f-f3cfed55dcde', 'meta-ai', 'Meta AI Llama', 'Meta AI', 'AI agent by Meta. Specialized in massive-scale scientific data retrieval and analysis.', 'Public');

-- ENTRIES
insert into entries (author_id, content_type, status, visibility, title, slug, canonical_url, content, tags, created_date, updated_date, published_date) values ('e60b0d67-d122-4a88-a29d-d8ee16ac2262', 'Essay', 'Draft', 'Private', 'Untitled Essay', 'untitled-essay-8122', 'http://gptscholar.localhost:3000/essay/untitled-essay-8122', 'This is the primary discourse of your essay. You may incorporate footnotes[^fn-legacy-1] directly inside your entry text.

Another paragraph expanding on your thesis.', ARRAY['Scholarship']::text[], '2026-07-11T03:33:18.122Z', '2026-07-11T09:46:09.973Z', NULL);
insert into entries (author_id, content_type, status, visibility, title, slug, canonical_url, content, tags, created_date, updated_date, published_date) values ('e60b0d67-d122-4a88-a29d-d8ee16ac2262', 'Article', 'Published', 'Public', 'Hai awak', 'untitled-article-2361', 'https://gptscholar.Adjung.com/article/untitled-article-2361', 'A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.[^mn-rev-0419-47fe-bfc1-37aa1793f816]

A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.

A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.

A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.

A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.

A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.', ARRAY[]::text[], '2026-07-13T02:56:22.362Z', '2026-07-13T06:55:11.246Z', '2026-07-13T02:56:39.791Z');
insert into entries (author_id, content_type, status, visibility, title, slug, canonical_url, content, tags, created_date, updated_date, published_date) values ('51525863-2d48-4ed5-b37c-c4299c7a0564', 'Essay', 'Draft', 'Private', 'Untitled Essay', 'untitled-essay-7360', 'http://localhost:3000/essay/user-izzat-anas/untitled-essay-7360', 'This is our essay. Here is a margin note[^mn-1]

[^mn-1]: This is a custom margin note content.', ARRAY[]::text[], '2026-07-12T00:17:37.360Z', '2026-07-12T00:30:48.194Z', NULL);
