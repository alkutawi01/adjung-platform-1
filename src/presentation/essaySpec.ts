import { PresentationSpec } from './specs';

export const essaySpec: PresentationSpec = {
  contentType: 'Essay',
  typography: {
    bodyFont: 'font-serif text-[#111111] leading-relaxed text-justify text-[15px]',
    signatureFont: 'font-signature text-5xl',
    interlinearFont: 'font-signature text-adjung-maroon'
  },
  spacing: {
    canvasMaxWidth: 'max-w-[860px]',
    canvasPadding: 'py-10 px-4 md:px-8',
    headerBottomMargin: 'mb-8 border-b border-adjung-maroon pb-6',
    paragraphSpacing: 'mb-6',
    signatureMarginTop: 'mt-16 pt-12'
  },
  visibility: {
    showTitle: true,
    showSubtitle: true,
    showAbstract: true,
    showCoverImage: true,
    showSignatureClosure: true,
    showNoteFooter: false,
    showCitations: true,
    showFootnotes: true
  }
};
