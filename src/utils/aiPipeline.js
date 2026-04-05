
// AI utility functions
import { storage } from './persistence';

export const guessCategory = (file) => {
  const n = file.name.toLowerCase();
  if (n.includes('faucet') || n.includes('sink') || n.includes('pipe') || n.includes('water') || n.includes('plumb')) return 'plumbing';
  if (n.includes('wall') || n.includes('drywall') || n.includes('hole') || n.includes('crack')) return 'drywall';
  if (n.includes('furniture') || n.includes('ikea') || n.includes('chair') || n.includes('desk') || n.includes('shelf')) return 'furniture';
  if (n.includes('electric') || n.includes('outlet') || n.includes('wire') || n.includes('switch')) return 'electrical';
  if (n.includes('box') || n.includes('moving') || n.includes('pack')) return 'moving';
  if (n.includes('paint') || n.includes('room') || n.includes('color')) return 'painting';
  if (n.includes('roof') || n.includes('shingle') || n.includes('gutter')) return 'roof';
  return 'default';
};

// Generate bounding boxes for visual overlay
export const generateBoundingBoxes = (category) => {
  const boxes = {
    plumbing: [
      { x: 35, y: 25, w: 30, h: 40, label: 'Leak Source', confidence: 0.97 },
      { x: 60, y: 55, w: 15, h: 20, label: 'Corrosion', confidence: 0.78 },
    ],
    drywall: [
      { x: 30, y: 20, w: 40, h: 50, label: 'Damage Area', confidence: 0.93 },
      { x: 55, y: 35, w: 20, h: 15, label: 'Crack Line', confidence: 0.85 },
    ],
    electrical: [
      { x: 40, y: 30, w: 25, h: 30, label: 'Outlet', confidence: 0.95 },
      { x: 50, y: 28, w: 5, h: 8, label: 'Scorch Mark', confidence: 0.71 },
    ],
    roof: [
      { x: 20, y: 30, w: 40, h: 30, label: 'Missing Shingle', confidence: 0.91 },
      { x: 65, y: 40, w: 20, h: 15, label: 'Granule Loss', confidence: 0.82 },
    ],
    furniture: [
      { x: 20, y: 15, w: 60, h: 70, label: 'Assembly Point', confidence: 0.92 },
    ],
    painting: [
      { x: 10, y: 10, w: 80, h: 80, label: 'Wall Surface', confidence: 0.96 },
    ],
    moving: [
      { x: 15, y: 30, w: 70, h: 50, label: 'Packed Items', confidence: 0.94 },
    ],
    default: [
      { x: 30, y: 25, w: 40, h: 50, label: 'Repair Area', confidence: 0.88 },
    ],
  };
  return boxes[category] || boxes.default;
};

// Match pros to specific estimate
export const matchProsToEstimate = (category, allPros) => {
  return allPros.filter(p =>
    p.categories && (
      p.categories.includes(category) ||
      p.categories.includes('Handyman')
    )
  ).sort((a, b) => parseInt(b.price) - parseInt(a.price));
};

// Local zip code rate adjustment
export const getZipMultiplier = (zip) => {
  const importPromise = import('../data/mockData.js');
  return importPromise.then(mod => {
    return mod.ZIP_RATES[zip] || mod.ZIP_RATES['default'];
  }).catch(() => 1.0);
};

export { storage };
