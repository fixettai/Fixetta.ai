
export const AI_ANALYSES = {
  default: { 
    job: "General Home Repair", 
    laborHours: "1–2", 
    cost: "75–150", 
    complexity: "Low", 
    complexityColor: "#10b981", 
    desc: "Our AI detected a general home repair task. A skilled handyman can assess and fix this quickly.", 
    category: "Handyman", 
    confidence: 94,
    materials: ["Basic hardware", "Common fittings"],
    materialCost: "15–25",
    questions: [
      { q: "Is this an indoor or outdoor repair?", options: ["Indoor", "Outdoor"] },
      { q: "How long has this issue been present?", options: ["Today", "This week", "Over a month"] },
    ]
  },
  plumbing: { 
    job: "Plumbing Repair", 
    laborHours: "1–3", 
    cost: "85–175", 
    complexity: "Medium", 
    complexityColor: "#f59e0b", 
    desc: "Detected signs of water damage or pipe issues. A licensed plumber should inspect and repair the leak to prevent further damage.", 
    category: "Plumbing", 
    confidence: 97,
    materials: ["Pipe fittings", "Plumber's tape", "Sealant"],
    materialCost: "20–45",
    questions: [
      { q: "Is the leak coming from a handle or the base?", options: ["Handle", "Base", "Pipe joint"] },
      { q: "Is there visible water staining on walls?", options: ["Yes, significant", "Minor spots", "None visible"] },
    ]
  },
  furniture: { 
    job: "Furniture Assembly", 
    laborHours: "1–4", 
    cost: "65–130", 
    complexity: "Low", 
    complexityColor: "#10b981", 
    desc: "Unassembled or partially assembled furniture detected. A skilled assembler can put this together efficiently.", 
    category: "Assembly", 
    confidence: 92,
    materials: ["Assembly hardware", "Allen keys"],
    materialCost: "0–10",
    questions: [
      { q: "Do you have the original instruction manual?", options: ["Yes", "Lost it", "Have a PDF"] },
    ]
  },
  drywall: { 
    job: "Drywall Patch & Paint", 
    laborHours: "3–6", 
    cost: "120–280", 
    complexity: "Medium", 
    complexityColor: "#f59e0b", 
    desc: "Wall damage detected requiring patching, sanding, priming, and repainting. Professional finish guaranteed.", 
    category: "Painting",
    confidence: 89,
    materials: ["Drywall patch", "Joint compound", "Sanding paper", "Paint"],
    materialCost: "25–55",
    questions: [
      { q: "Is the drywall soft or crumbling when touched?", options: ["Firm", "Slightly soft", "Crumbling"] },
    ]
  },
  electrical: { 
    job: "Electrical Inspection & Repair", 
    laborHours: "2–4", 
    cost: "150–350", 
    complexity: "High", 
    complexityColor: "#ef4444", 
    desc: "Potential electrical issue detected. A licensed electrician should assess for safety — do not DIY electrical work.", 
    category: "Electrical", 
    confidence: 91,
    materials: ["Replacement outlet", "Wire connectors", "Circuit breaker"],
    materialCost: "30–65",
    questions: [
      { q: "Is there a burning smell or scorch marks?", options: ["Yes, noticeable", "Slight odor", "None"] },
      { q: "Is the issue intermittent or constant?", options: ["Constant", "Intermittent", "Only on certain outlets"] },
    ]
  },
  moving: { 
    job: "Moving & Packing Help", 
    laborHours: "3–6", 
    cost: "200–450", 
    complexity: "Medium", 
    complexityColor: "#f59e0b", 
    desc: "Moving boxes and items detected. Professional movers can safely pack, lift, and transport your belongings.", 
    category: "Moving", 
    confidence: 96,
    materials: ["Moving blankets", "Dolly", "Packing tape"],
    materialCost: "40–80",
    questions: [
      { q: "What floor is the pickup from?", options: ["Ground floor", "1–2 floors (stairs)", "3+ floors"] },
    ]
  },
  painting: { 
    job: "Interior Painting", 
    laborHours: "4–8", 
    cost: "180–400", 
    complexity: "Low", 
    complexityColor: "#10b981", 
    desc: "Room requiring a fresh coat detected. Professional painters prep, prime, and apply with clean lines and no mess.", 
    category: "Painting", 
    confidence: 93,
    materials: ["Primer", "Paint (2 gal)", "Drop cloths", "Tape"],
    materialCost: "60–120",
    questions: [
      { q: "Is there existing wallpaper to remove?", options: ["Yes, must remove", "Some spots", "No wallpaper"] },
    ]
  },
  roof: { 
    job: "Roof Inspection & Repair", 
    laborHours: "3–5", 
    cost: "300–800", 
    complexity: "High", 
    complexityColor: "#ef4444", 
    desc: "Possible roof damage or wear detected. A certified roofer should inspect and repair to prevent water intrusion.", 
    category: "Roofing", 
    confidence: 88,
    materials: ["Replacement shingles", "Roofing cement", "Flashing"],
    materialCost: "80–160",
    questions: [
      { q: "Have you noticed interior ceiling leaks?", options: ["Yes, active leak", "Water stains", "None"] },
    ]
  },
};

// Zip-code adjusted labor rate multiplier
export const ZIP_RATES = {
  "default": 1.0,
  "23219": 1.0,
  "23220": 1.0,
  "23221": 0.95,
  "94102": 1.8,
  "10001": 1.9,
  "33101": 1.4,
  "75001": 0.9,
  "60601": 1.3,
};

export const PROS = [
  { id:1, name:"Marcus T.", rating:4.97, reviews:218, specialty:"Plumbing & Pipes", dist:"0.8 mi", avail:"Today 2pm", price:"95", priceUnit:"hr", initials:"MT", color:"#0ea5e9", badge:"Top Pro", jobs:342, verified:true, categories:["Plumbing","Handyman"] }, 
  { id:2, name:"Sarah L.", rating:4.94, reviews:176, specialty:"Handyman & Repairs", dist:"1.2 mi", avail:"Today 4pm", price:"75", priceUnit:"hr", initials:"SL", color:"#8b5cf6", badge:"Fast Response", jobs:289, verified:true, categories:["Handyman","Assembly","Painting"] },
  { id:3, name:"James W.", rating:4.91, reviews:203, specialty:"General Contracting", dist:"2.1 mi", avail:"Tomorrow 9am", price:"85", priceUnit:"hr", initials:"JW", color:"#f59e0b", badge:"Licensed & Insured", jobs:410, verified:true, categories:["Handyman","Painting","Roofing"] }, 
  { id:4, name:"Ana R.", rating:4.89, reviews:134, specialty:"Interior & Painting", dist:"1.5 mi", avail:"Today 6pm", price:"70", priceUnit:"hr", initials:"AR", color:"#ec4899", badge:"Background Checked", jobs:196, verified:true, categories:["Painting","Handyman"] },
  { id:5, name:"Derek M.", rating:4.86, reviews:97, specialty:"Electrical & Smart Home", dist:"3.0 mi", avail:"Tomorrow 11am", price:"110", priceUnit:"hr", initials:"DM", color:"#10b981", badge:"Master Electrician", jobs:158, verified:true, categories:["Electrical","Handyman"] },
  { id:6, name:"Chris B.", rating:4.83, reviews:145, specialty:"Roofing & Gutters", dist:"2.8 mi", avail:"Tomorrow 8am", price:"90", priceUnit:"hr", initials:"CB", color:"#f97316", badge:"Certified Roofer", jobs:267, verified:true, categories:["Roofing","Handyman"] },
  { id:7, name:"Lisa K.", rating:4.90, reviews:88, specialty:"Moving Services", dist:"1.0 mi", avail:"Today 3pm", price:"80", priceUnit:"hr", initials:"LK", color:"#06b6d4", badge:"Insured Movers", jobs:134, verified:true, categories:["Moving"] },
];

export const SERVICE_TILES = [
  { icon:"🔧", name:"Plumbing", key:"plumbing" },
  { icon:"⚡", name:"Electric", key:"electrical" },
  { icon:"🪑", name:"Assembly", key:"furniture" },
  { icon:"📦", name:"Moving", key:"moving" },
  { icon:"🎨", name:"Painting", key:"painting" },
  { icon:"🪟", name:"Drywall", key:"drywall" },
  { icon:"🏠", name:"Roofing", key:"roof" },
  { icon:"✨", name:"Cleaning", key:"default" },
];

export const MOCK_PROJECTS = [
  { id:1, title:"Leaky Kitchen Faucet", status:"Completed", date:"Mar 28, 2026", pro:"Marcus T.", emoji:"🚿", cost:"105" }, 
  { id:2, title:"IKEA Dresser Assembly", status:"Completed", date:"Mar 15, 2026", pro:"Sarah L.", emoji:"🪑", cost:"90" },
  { id:3, title:"Bedroom Wall Repaint", status:"In Progress", date:"Apr 2, 2026", pro:"Ana R.", emoji:"🎨", cost:"$240" },
];

export const VITALS_DEFAULT = {
  homeType: "Single Family",
  yearBuilt: "1998",
  sqft: "1,800",
  bedrooms: "3",
  bathrooms: "2",
  plumbing: "Copper",
  electrical: "200 Amp",
  roofType: "Asphalt Shingle",
  roofAge: "8 yrs",
};
