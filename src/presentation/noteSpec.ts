import { PresentationSpec } from './specs';

export const noteSpec: PresentationSpec = {
  contentType: 'Note',
  typography: {
    bodyFont: 'font-serif text-[#111111] leading-relaxed text-left text-[15px]',
    signatureFont: 'font-signature text-2xl',
    interlinearFont: 'font-signature text-adjung-maroon'
  },
  spacing: {
    canvasMaxWidth: 'max-w-[840px]',
    canvasPadding: 'py-10 px-4 md:px-[196px]',
    headerBottomMargin: 'mb-4',
    paragraphSpacing: 'mb-4',
    signatureMarginTop: 'mt-8 pt-4'
  },
  visibility: {
    showTitle: false,
    showSubtitle: false,
    showAbstract: false,
    showCoverImage: false,
    showSignatureClosure: false,
    showNoteFooter: true,
    showCitations: true,
    showFootnotes: true
  }
};
