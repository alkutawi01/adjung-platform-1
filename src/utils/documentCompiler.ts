import React from 'react';
import { PublishedRepresentation } from '../types';

export interface DocumentRepresentationPayload {
  surface: 'laid-paper' | 'deckled-white';
  header?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
    divider: boolean;
    gapClass: string;
  };
  content: {
    alignment: 'left' | 'center';
    body: React.ReactNode;
  };
  footer?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
    divider: boolean;
    gapClass: string;
  };
}

export function compileDocument(
  type: 'note' | 'essay',
  inputs: {
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode;
    content: React.ReactNode;
    footerLeft?: React.ReactNode;
    footerRight?: React.ReactNode;
  }
): PublishedRepresentation {
  const isNote = type === 'note';

  const payload: DocumentRepresentationPayload = {
    surface: isNote ? 'laid-paper' : 'deckled-white',
    header: (inputs.headerLeft || inputs.headerRight) ? {
      left: inputs.headerLeft,
      right: inputs.headerRight,
      divider: false,
      gapClass: 'mb-4'
    } : undefined,
    content: {
      alignment: isNote ? 'left' : 'center',
      body: inputs.content
    },
    footer: (inputs.footerLeft || inputs.footerRight) ? {
      left: inputs.footerLeft,
      right: inputs.footerRight,
      divider: false,
      gapClass: 'mt-4'
    } : undefined
  };

  return {
    id: `doc-rep-${Date.now()}`,
    version: 1,
    representationType: type,
    representationData: payload,
    metadata: {
      compiledAt: new Date().toISOString(),
      pipelineVersion: '1.0',
      sourceEditor: `${type.toUpperCase()} Compiler`,
      specVersion: 'SPEC-025'
    }
  };
}
