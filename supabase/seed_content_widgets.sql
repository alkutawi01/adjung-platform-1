update system_settings set
  in_the_news_google_doc_url = 'https://docs.google.com/document/d/1lgsNG0DCBFwPIi4wNhXhFNdGMhRMdtO1YJhaj1KM-Uc/edit?usp=sharing',
  world_clock_holidays_google_doc_url = 'https://docs.google.com/document/d/113UzisNDUdfrSxGRwkBZoAokyFle_CSmM9mBDa6YgHs/edit?usp=sharing',
  research_findings_cached_text = 'Finding: Early heavy social media use dramatically increases teens'' risk of cannabis and nicotine experimentation.
Source: American Journal of Psychiatry, 2026

Finding: TikTok, Instagram, YouTube harm teen well-being, self-esteem, friendships; Snapchat/WhatsApp differ.
Source: Current Psychology, Springer Nature, 2024

Finding: Cyberostracism on social media reduces adolescent well-being and increases negative emotional, behavioral, antisocial responses.
Source: Frontiers in Psychology, 2023

Finding: Deep reading builds cognitive reserve, strengthens memory, attention, and reasoning; improves face recognition ability.
Source: Max Planck Institute, 2026

Finding: Six minutes of reading reduces stress by 68%, outperforming music, tea, or walking.
Source: University of Sussex, 2009',
  in_the_news_cached_text = 'Desk: Astronomy
Title: Rubin Observatory Releases First Deep Sky Images
Brief: First imagery from Rubin Observatory reveals millions of galaxies and thousands of asteroids, demonstrating unprecedented survey power that will transform understanding of dark matter and transient phenomena.
Source: NSF
URL: https://www.nsf.gov/news/first-imagery-nsf-doe-vera-c-rubin-observatory

---
Desk: Space
Title: Euclid Finds Earliest Quasars in Distant Universe
Brief: ESA''s Euclid telescope identified 31 distant quasars, including two earliest known, offering new insight into black hole growth and reionisation in infant universe.
Source: ESA
URL: https://www.esa.int/Science_Exploration/Space_Science/Euclid/Euclid_discovers_the_most_ancient_quasar_in_the_Universe

---
Desk: Science
Title: Curiosity Finds Diverse Organic Molecules on Mars
Brief: NASA''s rover found unprecedented variety of carbon molecules in ancient clay rocks, strengthening evidence that Mars once had conditions suitable for life.
Source: NASA
URL: https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-finds-organic-molecules-never-seen-before-on-mars/

---
Desk: Medicine
Title: WHO Prepares Framework for New Tuberculosis Vaccines
Brief: WHO outlined guidance to help countries introduce future TB vaccines for adults, where most disease burden occurs and current vaccine falls short.
Source: WHO
URL: https://www.who.int/publications/i/item/9789240086593

---
Desk: Artificial Intelligence
Title: Open Model Maps One Billion Protein Structures
Brief: New open-source AI atlas predicts over a billion protein shapes, vastly expanding accessible biological data and accelerating research beyond AlphaFold.
Source: Nature
URL: https://www.nature.com/articles/d41586-026-01686-3

---
Desk: Heritage
Title: UNESCO Adds Sixty Three Living Heritage Elements
Brief: UNESCO inscribed 63 living traditions, from craftsmanship to festive rituals, expanding recognition of intangible heritage as a driver of social cohesion and intercultural dialogue.
Source: UNESCO
URL: https://www.unesco.org/en/articles/unesco-intangible-heritage-63-new-inscriptions

---
Desk: Libraries
Title: Library of Congress Preserves Collections in Synthetic DNA
Brief: Library of Congress will encode historic documents into synthetic DNA for a time capsule, testing durable molecular storage that could preserve cultural memory for centuries.
Source: Library of Congress
URL: https://www.loc.gov/item/prn-26-038/library-to-add-cutting-edge-molecular-data-storage-device-carrying-digitized-collections-to-americas-time-capsule/2026-05-20/

---
Desk: Islamic Affairs
Title: Oman Navigation Manuscript Recognised by UNESCO
Brief: UNESCO inscribed Ahmad bin Majid''s 15th-century navigation guide Al-Nuniyya al-Kubra, recognising its advanced geographic vision and maritime heritage for global scholarship.
Source: Government of Oman
URL: https://www.fm.gov.om/en/26681/?lang=ar

---
Desk: Environment
Title: NASA Confirms 2024 as Warmest Year on Record
Brief: NASA analysis shows 2024 global temperatures exceeded previous records, underscoring accelerating warming trend and growing relevance of long-term climate data.
Source: NASA
URL: https://www.nasa.gov/news-release/temperatures-rising-nasa-confirms-2024-warmest-year-on-record/

---
Desk: Museums
Title: British Museum Reframes Islamic World Gallery Display
Brief: British Museum''s Albukhary Gallery presents Islamic material culture from seventh century onward, broadening geographic scope and connecting historical artefacts to contemporary contexts.
Source: British Museum
URL: https://islamicworld.britishmuseum.org/',
  in_the_news_last_fetched = now(),
  google_doc_sync_times = '12:10, 00:10',
  featured_scholar_id = null,
  featured_entry_id = (
    select id from entries
    where slug = 'untitled-essay-8122'
      and author_id = (select id from users where username = 'chatgpt')
    limit 1
  )
where id = 1;
