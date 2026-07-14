export interface BlockConstraint {
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
}

export const BLOCK_SPECIFICATIONS: Record<string, BlockConstraint> = {
  menegak: { width: 400, height: 600, paddingX: 16, paddingY: 16 },
  melintang: { width: 800, height: 400, paddingX: 20, paddingY: 20 },
  kompak: { width: 300, height: 300, paddingX: 12, paddingY: 12 },
  penuh: { width: 1000, height: 1200, paddingX: 24, paddingY: 24 },
  
  // English aliases
  Vertical: { width: 400, height: 600, paddingX: 16, paddingY: 16 },
  Horizontal: { width: 800, height: 400, paddingX: 20, paddingY: 20 },
  Compact: { width: 300, height: 300, paddingX: 12, paddingY: 12 },
  Full: { width: 1000, height: 1200, paddingX: 24, paddingY: 24 }
};
