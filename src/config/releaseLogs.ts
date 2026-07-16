import { ReleaseLog } from '../types';

export const INITIAL_RELEASE_LOGS: ReleaseLog[] = [
  {
    id: 'rel-1.0',
    version: 'v1.0.0',
    date: '2026-06-01T00:00:00Z',
    changes: {
      added: [
        'Initial scriptorium structure and scholarly architecture.',
        'Continuous timeline folio support for scholars.'
      ],
      improved: [
        'Typographic proportions based on Ibn Rushd\'s Al-Mizan.'
      ]
    }
  },
  {
    id: 'rel-1.8',
    version: 'v1.8.0',
    date: '2026-07-05T00:00:00Z',
    changes: {
      added: [
        'Handwritten signature pads and vector strokes rendering.',
        'Institutional communication modules: Notices and Editor\'s Notes.'
      ],
      improved: [
        'Dynamic scroll transparency on top navigation bars.'
      ],
      fixed: [
        'Database corruption issues caused by text serialization.'
      ]
    }
  }
];
