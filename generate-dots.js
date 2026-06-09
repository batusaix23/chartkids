#!/usr/bin/env node
// generate-dots.js — ChartKids Connect the Dots generator (100% programmatic)
// Usage: node generate-dots.js [--force] [--id=1] [--category=animals]

const fs   = require('fs');
const path = require('path');

const BASE_DIR   = __dirname;
const OUT_DIR    = path.join(BASE_DIR, 'dots');
const SVG_DIR    = path.join(BASE_DIR, 'generated', 'svgs', 'dots');
const PAGES_FILE = path.join(BASE_DIR, 'master-dots-72.json');
const SITEMAP    = path.join(BASE_DIR, 'sitemap.xml');

const args       = process.argv.slice(2);
const FORCE      = args.includes('--force');
const ID_FILTER  = parseInt((args.find(a => a.startsWith('--id='))       || '').split('=')[1]) || null;
const CAT_FILTER =           (args.find(a => a.startsWith('--category=')) || '').split('=')[1];

const DOTS_COUNT = { easy: 18, medium: 30, hard: 48 };
const DOT_RADIUS = { easy: 6,  medium: 5,  hard: 4  };
const FONT_SIZE  = { easy: 9,  medium: 8,  hard: 6.5 };

const CAT_COLORS = {
  animals:'#22c55e', dinosaurs:'#ef4444', space:'#06b6d4', vehicles:'#f59e0b',
  food:'#f97316', fantasy:'#a78bfa', jobs:'#34d399', sports:'#3b82f6',
  nature:'#84cc16', holidays:'#ec4899', superheroes:'#f43f5e', pets:'#fb923c',
};
const CAT_LABELS = {
  animals:'Animals', dinosaurs:'Dinosaurs', space:'Space', vehicles:'Vehicles',
  food:'Food & Fruits', fantasy:'Princesses & Fantasy', jobs:'Jobs & Careers', sports:'Sports',
  nature:'Nature & Seasons', holidays:'Holidays', superheroes:'Superheroes', pets:'Pets & Insects',
};
const CAT_EMOJIS = {
  animals:'🦁', dinosaurs:'🦕', space:'🚀', vehicles:'🚗',
  food:'🍕', fantasy:'🐉', jobs:'👷', sports:'⚽',
  nature:'🌻', holidays:'🎄', superheroes:'🦸', pets:'🐾',
};

// ── Shape library ─────────────────────────────────────────────────────────────
// Each shape returns array of [x,y] in 500x650 canvas space
// cx,cy = center, sc = scale factor

function ptOnEllipse(cx, cy, rx, ry, angle) {
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
}

function samplePath(points, n) {
  // Given polygon points, sample n evenly-spaced points along the path
  const closed = points;
  const segs = [];
  let total = 0;
  for (let i=0; i<closed.length; i++) {
    const a = closed[i], b = closed[(i+1)%closed.length];
    const d = Math.hypot(b[0]-a[0], b[1]-a[1]);
    segs.push({a,b,d}); total += d;
  }
  const step = total / n;
  const result = [];
  let dist = 0, seg = 0, segPos = 0;
  for (let i=0; i<n; i++) {
    const target = i * step;
    while (seg < segs.length-1 && dist + segs[seg].d < target) {
      dist += segs[seg].d; seg++;
    }
    const t = segs[seg].d > 0 ? Math.min(1, (target - dist) / segs[seg].d) : 0;
    result.push([
      segs[seg].a[0] + t*(segs[seg].b[0]-segs[seg].a[0]),
      segs[seg].a[1] + t*(segs[seg].b[1]-segs[seg].a[1]),
    ]);
  }
  return result;
}

function ellipsePts(cx, cy, rx, ry, startAngle, n) {
  return Array.from({length:n}, (_,i) => {
    const a = startAngle + (i/n) * Math.PI * 2;
    return ptOnEllipse(cx, cy, rx, ry, a);
  });
}

// Shape templates — outline points for each subject type
const SHAPES = {

  // ── ANIMALS ──
  quadruped: (cx,cy,sc) => {
    // Body + head + legs + tail outline
    const pts = [
      [cx-90*sc, cy+30*sc],[cx-90*sc, cy-20*sc],[cx-70*sc, cy-60*sc], // back
      [cx-40*sc, cy-70*sc],[cx-10*sc, cy-75*sc],[cx+20*sc, cy-70*sc], // back→head
      [cx+55*sc, cy-80*sc],[cx+85*sc, cy-70*sc],[cx+90*sc, cy-50*sc], // head top
      [cx+90*sc, cy-30*sc],[cx+80*sc, cy-10*sc],[cx+70*sc, cy+10*sc], // head front
      [cx+60*sc, cy+30*sc],[cx+50*sc, cy+50*sc],[cx+40*sc, cy+90*sc], // front leg 1
      [cx+20*sc, cy+90*sc],[cx+10*sc, cy+50*sc],[cx+5*sc,  cy+30*sc], // front leg 1 back
      [cx-10*sc, cy+40*sc],[cx-20*sc, cy+90*sc],                      // front leg 2
      [cx-35*sc, cy+90*sc],[cx-40*sc, cy+40*sc],[cx-50*sc, cy+30*sc], // front leg 2 back
      [cx-60*sc, cy+50*sc],[cx-65*sc, cy+90*sc],                      // back leg 1
      [cx-80*sc, cy+90*sc],[cx-82*sc, cy+50*sc],                      // back leg 1
      [cx-100*sc,cy+30*sc],[cx-110*sc,cy+10*sc],[cx-100*sc,cy+0*sc],  // tail
    ];
    return pts;
  },

  bird: (cx,cy,sc) => {
    const pts = [
      [cx,      cy-90*sc],[cx+15*sc, cy-80*sc],[cx+25*sc, cy-65*sc], // head top
      [cx+30*sc, cy-50*sc],[cx+35*sc, cy-40*sc],[cx+40*sc, cy-35*sc], // beak
      [cx+35*sc, cy-28*sc],[cx+25*sc, cy-30*sc],[cx+20*sc, cy-20*sc], // below beak
      [cx+80*sc, cy+10*sc],[cx+90*sc, cy+30*sc],[cx+70*sc, cy+50*sc], // right wing tip
      [cx+40*sc, cy+40*sc],[cx+30*sc, cy+60*sc],[cx+20*sc, cy+90*sc], // right leg
      [cx+8*sc,  cy+90*sc],[cx+10*sc, cy+60*sc],[cx-10*sc, cy+60*sc],
      [cx-20*sc, cy+90*sc],[cx-32*sc, cy+90*sc],[cx-30*sc, cy+60*sc],
      [cx-40*sc, cy+40*sc],[cx-80*sc, cy+30*sc],[cx-90*sc, cy+10*sc], // left wing
      [cx-70*sc, cy-10*sc],[cx-20*sc, cy-20*sc],
    ];
    return pts;
  },

  fish: (cx,cy,sc) => {
    const pts = [
      [cx+90*sc, cy],[cx+80*sc, cy-30*sc],[cx+60*sc, cy-50*sc],    // top back
      [cx+30*sc, cy-55*sc],[cx,   cy-50*sc],[cx-30*sc,cy-40*sc],  // top body
      [cx-60*sc, cy-20*sc],[cx-80*sc, cy-30*sc],[cx-100*sc,cy],   // tail top
      [cx-110*sc,cy-40*sc],[cx-115*sc,cy],                         // tail
      [cx-110*sc,cy+40*sc],[cx-100*sc,cy],
      [cx-80*sc, cy+30*sc],[cx-60*sc, cy+20*sc],[cx-30*sc,cy+40*sc],
      [cx,   cy+50*sc],[cx+30*sc, cy+55*sc],[cx+60*sc,cy+50*sc],  // bottom
      [cx+80*sc, cy+30*sc],
    ];
    return pts;
  },

  // ── DINOSAURS ──
  trex: (cx,cy,sc) => {
    const pts = [
      [cx-20*sc,cy-110*sc],[cx,cy-120*sc],[cx+30*sc,cy-115*sc],      // head top
      [cx+50*sc,cy-100*sc],[cx+60*sc,cy-80*sc],[cx+55*sc,cy-60*sc],  // head front
      [cx+45*sc,cy-45*sc],[cx+30*sc,cy-40*sc],                        // jaw
      [cx+25*sc,cy-50*sc],[cx+15*sc,cy-60*sc],[cx+5*sc,cy-55*sc],    // tiny arms
      [cx,cy-30*sc],[cx+10*sc,cy+20*sc],[cx+30*sc,cy+60*sc],         // belly → leg1
      [cx+40*sc,cy+110*sc],[cx+50*sc,cy+115*sc],[cx+60*sc,cy+110*sc],// foot1
      [cx+55*sc,cy+90*sc],[cx+40*sc,cy+70*sc],[cx+20*sc,cy+60*sc],   // between legs
      [cx+10*sc,cy+110*sc],[cx+20*sc,cy+115*sc],[cx+25*sc,cy+110*sc],// foot2
      [cx+5*sc,cy+80*sc],[cx-10*sc,cy+40*sc],[cx-30*sc,cy],          // back leg
      [cx-60*sc,cy-20*sc],[cx-90*sc,cy-30*sc],[cx-100*sc,cy-20*sc],  // tail
      [cx-80*sc,cy-50*sc],[cx-60*sc,cy-70*sc],[cx-40*sc,cy-85*sc],   // back
    ];
    return pts;
  },

  // ── VEHICLES ──
  car: (cx,cy,sc) => {
    const body = [
      [cx-90*sc,cy+30*sc],[cx-90*sc,cy-10*sc],[cx-70*sc,cy-10*sc],  // rear
      [cx-50*sc,cy-45*sc],[cx-20*sc,cy-60*sc],[cx+30*sc,cy-60*sc],  // roof
      [cx+60*sc,cy-45*sc],[cx+80*sc,cy-10*sc],[cx+90*sc,cy-10*sc],  // front
      [cx+90*sc,cy+10*sc],[cx+65*sc,cy+10*sc],                       // before wheel
      [cx+65*sc,cy+30*sc],                                            // right wheel bottom
      [cx+20*sc,cy+30*sc],                                            // between wheels
      [cx-20*sc,cy+30*sc],                                            // left wheel bottom
      [cx-65*sc,cy+30*sc],
    ];
    // Add wheel arcs
    const rw1 = ellipsePts(cx+65*sc, cy+15*sc, 22*sc, 22*sc, 0, 8);
    const rw2 = ellipsePts(cx-65*sc, cy+15*sc, 22*sc, 22*sc, 0, 8);
    return [...body, ...rw1, ...rw2];
  },

  rocket: (cx,cy,sc) => {
    const pts = [
      [cx,cy-120*sc],[cx+15*sc,cy-100*sc],[cx+25*sc,cy-70*sc],   // nose top
      [cx+30*sc,cy-40*sc],[cx+35*sc,cy+20*sc],[cx+35*sc,cy+60*sc],// body right
      [cx+60*sc,cy+100*sc],[cx+70*sc,cy+120*sc],                   // right fin
      [cx+50*sc,cy+110*sc],[cx+40*sc,cy+80*sc],
      [cx+35*sc,cy+70*sc],[cx-35*sc,cy+70*sc],                     // bottom
      [cx-40*sc,cy+80*sc],[cx-50*sc,cy+110*sc],                    // left fin
      [cx-70*sc,cy+120*sc],[cx-60*sc,cy+100*sc],
      [cx-35*sc,cy+60*sc],[cx-35*sc,cy+20*sc],[cx-30*sc,cy-40*sc],
      [cx-25*sc,cy-70*sc],[cx-15*sc,cy-100*sc],
    ];
    return pts;
  },

  airplane: (cx,cy,sc) => {
    const pts = [
      [cx+120*sc,cy],[cx+100*sc,cy-15*sc],[cx+60*sc,cy-20*sc],    // nose→fuselage top
      [cx+20*sc,cy-20*sc],[cx+10*sc,cy-70*sc],[cx-20*sc,cy-90*sc],// main wing
      [cx-60*sc,cy-90*sc],[cx-70*sc,cy-70*sc],[cx-40*sc,cy-20*sc],// wing right
      [cx-80*sc,cy-20*sc],[cx-100*sc,cy-10*sc],[cx-110*sc,cy],    // tail section
      [cx-100*sc,cy+10*sc],[cx-80*sc,cy+20*sc],
      [cx-50*sc,cy+40*sc],[cx-60*sc,cy+60*sc],[cx-30*sc,cy+60*sc],// tail fin
      [cx-20*sc,cy+40*sc],[cx-10*sc,cy+25*sc],[cx+40*sc,cy+25*sc],// fuselage bottom
      [cx+100*sc,cy+15*sc],
    ];
    return pts;
  },

  // ── SPACE ──
  astronaut: (cx,cy,sc) => {
    // Helmet + suit
    const helmet = ellipsePts(cx, cy-65*sc, 40*sc, 45*sc, -Math.PI/2, 12);
    const body = [
      [cx-35*sc,cy-25*sc],[cx-45*sc,cy-10*sc],[cx-50*sc,cy+20*sc],// left arm
      [cx-70*sc,cy+10*sc],[cx-80*sc,cy+25*sc],[cx-70*sc,cy+35*sc],// glove
      [cx-50*sc,cy+30*sc],[cx-45*sc,cy+50*sc],[cx-35*sc,cy+90*sc],// left leg
      [cx-20*sc,cy+115*sc],[cx-5*sc, cy+115*sc],[cx-5*sc, cy+90*sc],// left boot
      [cx+5*sc, cy+90*sc],[cx+5*sc, cy+115*sc],[cx+20*sc,cy+115*sc],// right boot
      [cx+35*sc,cy+90*sc],[cx+45*sc,cy+50*sc],[cx+50*sc,cy+30*sc],
      [cx+70*sc,cy+35*sc],[cx+80*sc,cy+25*sc],[cx+70*sc,cy+10*sc],
      [cx+50*sc,cy+20*sc],[cx+45*sc,cy-10*sc],[cx+35*sc,cy-25*sc],
    ];
    return [...helmet, ...body];
  },

  star: (cx,cy,sc) => {
    const pts = [];
    for(let i=0;i<5;i++){
      const outerA = (i*72-90)*Math.PI/180;
      const innerA = (i*72-90+36)*Math.PI/180;
      pts.push([cx+100*sc*Math.cos(outerA), cy+100*sc*Math.sin(outerA)]);
      pts.push([cx+40*sc*Math.cos(innerA),  cy+40*sc*Math.sin(innerA)]);
    }
    return pts;
  },

  // ── SUPERHEROES / JOBS / SPORTS ──
  person: (cx,cy,sc) => {
    const head = ellipsePts(cx, cy-90*sc, 28*sc, 32*sc, -Math.PI/2, 10);
    const body = [
      [cx-25*sc,cy-60*sc],[cx-35*sc,cy-40*sc],[cx-55*sc,cy-10*sc], // left arm
      [cx-65*sc,cy+20*sc],[cx-60*sc,cy+30*sc],[cx-50*sc,cy+20*sc], // left hand
      [cx-30*sc,cy-20*sc],[cx-25*sc,cy+20*sc],                      // torso left
      [cx-25*sc,cy+60*sc],[cx-30*sc,cy+110*sc],[cx-15*sc,cy+115*sc],// left leg
      [cx-5*sc, cy+115*sc],[cx,     cy+70*sc],
      [cx+5*sc, cy+115*sc],[cx+15*sc,cy+115*sc],[cx+30*sc,cy+110*sc],
      [cx+25*sc,cy+60*sc],[cx+25*sc,cy+20*sc],
      [cx+30*sc,cy-20*sc],[cx+50*sc,cy+20*sc],[cx+60*sc,cy+30*sc],[cx+65*sc,cy+20*sc],
      [cx+55*sc,cy-10*sc],[cx+35*sc,cy-40*sc],[cx+25*sc,cy-60*sc],
    ];
    return [...head, ...body];
  },

  // ── FANTASY ──
  unicorn: (cx,cy,sc) => {
    const pts = [
      [cx-20*sc,cy-120*sc],[cx,cy-100*sc],[cx+10*sc,cy-80*sc], // horn→head
      [cx+40*sc,cy-90*sc],[cx+60*sc,cy-80*sc],[cx+70*sc,cy-60*sc], // head top
      [cx+75*sc,cy-40*sc],[cx+70*sc,cy-20*sc],[cx+60*sc,cy-10*sc], // face
      [cx+55*sc,cy+10*sc],[cx+80*sc,cy+30*sc],[cx+90*sc,cy+60*sc], // neck→body
      [cx+80*sc,cy+90*sc],[cx+70*sc,cy+110*sc],[cx+60*sc,cy+115*sc],// back leg 1
      [cx+45*sc,cy+115*sc],[cx+40*sc,cy+100*sc],[cx+35*sc,cy+80*sc],
      [cx+20*sc,cy+80*sc],[cx+10*sc,cy+100*sc],[cx,     cy+115*sc], // back leg 2
      [cx-15*sc,cy+115*sc],[cx-15*sc,cy+80*sc],
      [cx-30*sc,cy+70*sc],[cx-70*sc,cy+60*sc],[cx-90*sc,cy+50*sc], // belly
      [cx-90*sc,cy+80*sc],[cx-85*sc,cy+115*sc],[cx-70*sc,cy+115*sc],// front leg
      [cx-65*sc,cy+80*sc],[cx-55*sc,cy+50*sc],
      [cx-50*sc,cy+70*sc],[cx-45*sc,cy+115*sc],[cx-30*sc,cy+115*sc],
      [cx-25*sc,cy+70*sc],[cx-20*sc,cy+40*sc],[cx-30*sc,cy+10*sc], // chest
      [cx-40*sc,cy-10*sc],[cx-30*sc,cy-60*sc],[cx-10*sc,cy-90*sc], // back to head
    ];
    return pts;
  },

  dragon: (cx,cy,sc) => {
    const pts = [
      [cx+10*sc,cy-110*sc],[cx+30*sc,cy-100*sc],[cx+50*sc,cy-80*sc], // head
      [cx+60*sc,cy-60*sc],[cx+70*sc,cy-40*sc],[cx+65*sc,cy-20*sc],
      [cx+55*sc,cy-10*sc],[cx+45*sc,cy-15*sc],
      [cx+90*sc,cy-60*sc],[cx+110*sc,cy-30*sc],[cx+100*sc,cy+10*sc], // wing
      [cx+70*sc,cy+30*sc],[cx+60*sc,cy+50*sc],[cx+70*sc,cy+90*sc],   // body
      [cx+55*sc,cy+115*sc],[cx+40*sc,cy+115*sc],[cx+35*sc,cy+90*sc],
      [cx+20*sc,cy+80*sc],[cx+10*sc,cy+115*sc],[cx-5*sc,cy+115*sc],
      [cx-5*sc,cy+80*sc],[cx-20*sc,cy+60*sc],[cx-50*sc,cy+40*sc],
      [cx-80*sc,cy+20*sc],[cx-100*sc,cy],[cx-110*sc,cy-20*sc],       // tail
      [cx-90*sc,cy-30*sc],[cx-60*sc,cy-20*sc],[cx-40*sc,cy-30*sc],
      [cx-60*sc,cy-70*sc],[cx-40*sc,cy-90*sc],[cx-10*sc,cy-100*sc],  // back
    ];
    return pts;
  },

  castle: (cx,cy,sc) => {
    const pts = [
      // Left tower
      [cx-100*sc,cy+120*sc],[cx-100*sc,cy-60*sc],[cx-115*sc,cy-60*sc],
      [cx-115*sc,cy-80*sc],[cx-100*sc,cy-80*sc],[cx-100*sc,cy-100*sc],
      [cx-85*sc, cy-100*sc],[cx-85*sc, cy-80*sc],[cx-70*sc,cy-80*sc],
      [cx-70*sc, cy-60*sc],[cx-85*sc, cy-60*sc],[cx-85*sc,cy-20*sc],
      // Gate arch top
      [cx-30*sc,cy-20*sc],[cx-30*sc,cy-80*sc],[cx,cy-100*sc],
      [cx+30*sc,cy-80*sc],[cx+30*sc,cy-20*sc],
      // Right tower
      [cx+70*sc, cy-20*sc],[cx+70*sc, cy-60*sc],[cx+85*sc,cy-60*sc],
      [cx+85*sc, cy-80*sc],[cx+70*sc, cy-80*sc],[cx+70*sc,cy-100*sc],
      [cx+85*sc, cy-100*sc],[cx+100*sc,cy-80*sc],[cx+115*sc,cy-80*sc],
      [cx+115*sc,cy-60*sc],[cx+100*sc,cy-60*sc],[cx+100*sc,cy+120*sc],
    ];
    return pts;
  },

  // ── FOOD ──
  pizza: (cx,cy,sc) => {
    const sliceOuter = Array.from({length:16}, (_,i) => {
      const a = (-150 + i * 120/15) * Math.PI/180;
      return [cx + 100*sc*Math.cos(a), cy + 100*sc*Math.sin(a)];
    });
    return [
      [cx,cy],
      ...sliceOuter,
      [cx,cy],
      // Crust bumps
      [cx-30*sc, cy-100*sc],[cx-60*sc,cy-80*sc],[cx-80*sc,cy-50*sc],
      [cx-95*sc, cy-20*sc],[cx-90*sc, cy+15*sc],
    ];
  },

  cake: (cx,cy,sc) => {
    const pts = [
      // Cake body
      [cx-80*sc,cy+80*sc],[cx-80*sc,cy],
      [cx-80*sc,cy-30*sc],[cx-60*sc,cy-50*sc],  // frosting wave
      [cx-30*sc,cy-30*sc],[cx,cy-55*sc],         // frosting
      [cx+30*sc,cy-30*sc],[cx+60*sc,cy-50*sc],
      [cx+80*sc,cy-30*sc],[cx+80*sc,cy],
      [cx+80*sc,cy+80*sc],
      // Bottom layer
      [cx+90*sc,cy+80*sc],[cx+90*sc,cy+110*sc],
      [cx-90*sc,cy+110*sc],[cx-90*sc,cy+80*sc],
      // Candle
      [cx-5*sc,cy-55*sc],[cx-5*sc,cy-100*sc],[cx+5*sc,cy-100*sc],[cx+5*sc,cy-55*sc],
    ];
    return pts;
  },

  icecream: (cx,cy,sc) => {
    // Cone + scoops
    const scoop1 = ellipsePts(cx, cy-50*sc, 55*sc, 55*sc, -Math.PI/2, 14);
    const scoop2 = ellipsePts(cx+20*sc, cy-100*sc, 40*sc, 40*sc, -Math.PI/2, 10);
    const cone = [
      [cx-55*sc,cy],
      [cx,cy+120*sc],
      [cx+55*sc,cy],
    ];
    return [...scoop1, ...scoop2, ...cone];
  },

  // ── NATURE ──
  tree: (cx,cy,sc) => {
    const pts = [
      // Trunk
      [cx-20*sc,cy+120*sc],[cx-20*sc,cy+50*sc],
      // Layers
      [cx-50*sc,cy+50*sc],[cx-80*sc,cy+20*sc],[cx-40*sc,cy+20*sc],
      [cx-60*sc,cy-20*sc],[cx-30*sc,cy-20*sc],
      [cx-50*sc,cy-55*sc],[cx-20*sc,cy-55*sc],
      [cx,cy-100*sc],                            // top
      [cx+20*sc,cy-55*sc],[cx+50*sc,cy-55*sc],
      [cx+30*sc,cy-20*sc],[cx+60*sc,cy-20*sc],
      [cx+40*sc,cy+20*sc],[cx+80*sc,cy+20*sc],
      [cx+50*sc,cy+50*sc],[cx+20*sc,cy+50*sc],
      [cx+20*sc,cy+120*sc],
    ];
    return pts;
  },

  flower: (cx,cy,sc) => {
    // 6 petals + stem
    const petals = Array.from({length:6}, (_,i) => {
      const a = (i*60)*Math.PI/180;
      const a2 = ((i*60)+30)*Math.PI/180;
      return [
        [cx+80*sc*Math.cos(a),  cy+80*sc*Math.sin(a)],
        [cx+90*sc*Math.cos(a2), cy+90*sc*Math.sin(a2)],
      ];
    }).flat();
    const center = ellipsePts(cx, cy, 30*sc, 30*sc, 0, 8);
    const stem = [[cx,cy+30*sc],[cx-10*sc,cy+60*sc],[cx,cy+80*sc],[cx+10*sc,cy+60*sc]];
    return [...petals, ...center, ...stem];
  },

  // ── HOLIDAYS ──
  xmastree: (cx,cy,sc) => {
    const pts = [
      [cx,cy-110*sc],
      [cx+30*sc,cy-70*sc],[cx+15*sc,cy-70*sc],
      [cx+50*sc,cy-30*sc],[cx+25*sc,cy-30*sc],
      [cx+70*sc,cy+20*sc],[cx+35*sc,cy+20*sc],
      [cx+90*sc,cy+80*sc],[cx-90*sc,cy+80*sc],  // base
      [cx-35*sc,cy+20*sc],[cx-70*sc,cy+20*sc],
      [cx-25*sc,cy-30*sc],[cx-50*sc,cy-30*sc],
      [cx-15*sc,cy-70*sc],[cx-30*sc,cy-70*sc],
      // Trunk
      [cx-20*sc,cy+80*sc],[cx-20*sc,cy+110*sc],
      [cx+20*sc,cy+110*sc],[cx+20*sc,cy+80*sc],
    ];
    return pts;
  },

  pumpkin: (cx,cy,sc) => {
    const left  = ellipsePts(cx-40*sc, cy+10*sc, 45*sc, 60*sc, -Math.PI/2, 10);
    const mid   = ellipsePts(cx,       cy+10*sc, 50*sc, 65*sc, -Math.PI/2, 10);
    const right = ellipsePts(cx+40*sc, cy+10*sc, 45*sc, 60*sc, -Math.PI/2, 10);
    const stem  = [[cx-8*sc,cy-55*sc],[cx-5*sc,cy-80*sc],[cx+5*sc,cy-80*sc],[cx+8*sc,cy-55*sc]];
    return [...left, ...mid, ...right, ...stem];
  },

  heart: (cx,cy,sc) => {
    return Array.from({length:20}, (_,i) => {
      const t = (i/20) * Math.PI * 2;
      const x = cx + 90*sc * Math.pow(Math.sin(t),3);
      const y = cy - 90*sc * (0.8125*Math.cos(t) - 0.3125*Math.cos(2*t) - 0.125*Math.cos(3*t) - 0.0625*Math.cos(4*t));
      return [x,y];
    });
  },

  // ── PETS / INSECTS ──
  butterfly: (cx,cy,sc) => {
    const lTop  = ellipsePts(cx-60*sc, cy-40*sc, 60*sc, 50*sc, -Math.PI/2, 10);
    const lBot  = ellipsePts(cx-50*sc, cy+30*sc, 45*sc, 35*sc, Math.PI/2, 8);
    const rTop  = ellipsePts(cx+60*sc, cy-40*sc, 60*sc, 50*sc, -Math.PI/2, 10);
    const rBot  = ellipsePts(cx+50*sc, cy+30*sc, 45*sc, 35*sc, Math.PI/2, 8);
    const body  = ellipsePts(cx, cy, 10*sc, 55*sc, -Math.PI/2, 8);
    return [...lTop,...lBot,...rTop,...rBot,...body];
  },

  cat: (cx,cy,sc) => {
    const head = ellipsePts(cx, cy-70*sc, 45*sc, 40*sc, -Math.PI/2, 10);
    const body = [
      [cx-45*sc,cy-35*sc],[cx-55*sc,cy],[cx-55*sc,cy+50*sc],
      [cx-50*sc,cy+90*sc],[cx-40*sc,cy+115*sc],[cx-25*sc,cy+115*sc],
      [cx-20*sc,cy+90*sc],[cx-5*sc, cy+60*sc],
      [cx+5*sc, cy+60*sc],[cx+20*sc,cy+90*sc],[cx+25*sc,cy+115*sc],
      [cx+40*sc,cy+115*sc],[cx+50*sc,cy+90*sc],
      [cx+55*sc,cy+50*sc],[cx+55*sc,cy],[cx+45*sc,cy-35*sc],
    ];
    // Ears
    const earL = [[cx-40*sc,cy-105*sc],[cx-20*sc,cy-115*sc],[cx-10*sc,cy-105*sc]];
    const earR = [[cx+10*sc,cy-105*sc],[cx+20*sc,cy-115*sc],[cx+40*sc,cy-105*sc]];
    return [...head,...earL,...earR,...body];
  },

  dog: (cx,cy,sc) => {
    const head = ellipsePts(cx+20*sc, cy-70*sc, 45*sc, 40*sc, -Math.PI/2, 10);
    const body = [
      [cx-20*sc,cy-35*sc],[cx-60*sc,cy-30*sc],[cx-80*sc,cy-10*sc],  // floppy ear
      [cx-70*sc,cy+20*sc],[cx-50*sc,cy+30*sc],
      [cx-55*sc,cy+60*sc],[cx-55*sc,cy+115*sc],[cx-40*sc,cy+115*sc],
      [cx-30*sc,cy+80*sc],[cx-10*sc,cy+60*sc],
      [cx+10*sc,cy+60*sc],[cx+30*sc,cy+80*sc],[cx+40*sc,cy+115*sc],
      [cx+55*sc,cy+115*sc],[cx+55*sc,cy+60*sc],
      [cx+50*sc,cy+30*sc],[cx+70*sc,cy+10*sc],  // tail
      [cx+90*sc,cy-10*sc],[cx+80*sc,cy-30*sc],[cx+60*sc,cy-40*sc],
    ];
    return [...head,...body];
  },

  // Soccer ball (sports)
  soccerball: (cx,cy,sc) => {
    return ellipsePts(cx, cy, 85*sc, 85*sc, -Math.PI/2, 20);
  },
};

// ── Shape selector per page ───────────────────────────────────────────────────
const PAGE_SHAPE = {
  // Animals
  'connect-the-lion-dots':      'quadruped',
  'connect-the-elephant-dots':  'quadruped',
  'connect-the-dolphin-dots':   'fish',
  'connect-the-tiger-dots':     'quadruped',
  'connect-the-eagle-dots':     'bird',
  'connect-the-whale-dots':     'fish',
  // Dinosaurs
  'connect-the-t-rex-dots':     'trex',
  'connect-the-triceratops-dots':'trex',
  'connect-the-pterodactyl-dots':'bird',
  'connect-the-stegosaurus-dots':'quadruped',
  'connect-the-brachiosaurus-dots':'quadruped',
  'connect-the-dino-herd-dots': 'trex',
  // Vehicles
  'connect-the-car-dots':       'car',
  'connect-the-fire-truck-dots':'car',
  'connect-the-airplane-dots':  'airplane',
  'connect-the-rocket-dots':    'rocket',
  'connect-the-train-dots':     'car',
  'connect-the-spaceship-dots': 'rocket',
  // Space
  'connect-the-rocket-dots':    'rocket',
  'connect-the-planet-dots':    'star',
  'connect-the-astronaut-dots': 'astronaut',
  'connect-the-alien-dots':     'person',
  'connect-the-ufo-dots':       'airplane',
  'connect-the-galaxy-dots':    'star',
  // Superheroes
  'connect-the-hero-dots':      'person',
  'connect-the-cape-dots':      'person',
  'connect-the-superhero-dots': 'person',
  'connect-the-robot-dots':     'person',
  'connect-the-team-dots':      'person',
  'connect-the-battle-dots':    'person',
  // Fantasy
  'connect-the-unicorn-dots':   'unicorn',
  'connect-the-princess-dots':  'person',
  'connect-the-dragon-dots':    'dragon',
  'connect-the-castle-dots':    'castle',
  'connect-the-fairy-dots':     'person',
  'connect-the-mermaid-dots':   'fish',
  // Jobs
  'connect-the-firefighter-dots':'person',
  'connect-the-doctor-dots':    'person',
  'connect-the-chef-dots':      'person',
  'connect-the-pilot-dots':     'person',
  'connect-the-scientist-dots': 'person',
  'connect-the-builder-dots':   'person',
  // Sports
  'connect-the-soccer-ball-dots':'soccerball',
  'connect-the-bicycle-dots':   'car',
  'connect-the-swimmer-dots':   'person',
  'connect-the-gymnast-dots':   'person',
  'connect-the-runner-dots':    'person',
  'connect-the-skater-dots':    'person',
  // Food
  'connect-the-pizza-dots':     'pizza',
  'connect-the-apple-dots':     'soccerball',
  'connect-the-cake-dots':      'cake',
  'connect-the-ice-cream-dots': 'icecream',
  'connect-the-sandwich-dots':  'cake',
  'connect-the-feast-dots':     'pizza',
  // Nature
  'connect-the-sun-dots':       'star',
  'connect-the-rainbow-dots':   'flower',
  'connect-the-flower-dots':    'flower',
  'connect-the-tree-dots':      'tree',
  'connect-the-butterfly-dots': 'butterfly',
  'connect-the-mountain-dots':  'xmastree',
  // Holidays
  'connect-the-christmas-tree-dots':'xmastree',
  'connect-the-pumpkin-dots':   'pumpkin',
  'connect-the-santa-dots':     'person',
  'connect-the-snowman-dots':   'soccerball',
  'connect-the-easter-egg-dots':'soccerball',
  'connect-the-fireworks-dots': 'star',
  // Pets
  'connect-the-puppy-dots':     'dog',
  'connect-the-kitten-dots':    'cat',
  'connect-the-rabbit-dots':    'dog',
  'connect-the-parrot-dots':    'bird',
  'connect-the-butterfly-dots': 'butterfly',
  'connect-the-fish-bowl-dots': 'fish',
};

// ── SVG generator ─────────────────────────────────────────────────────────────
function makeDotsSVG(page) {
  const color  = CAT_COLORS[page.category] || '#06b6d4';
  const label  = CAT_LABELS[page.category] || page.category;
  const emoji  = CAT_EMOJIS[page.category] || '🎯';
  const n      = DOTS_COUNT[page.difficulty] || 20;
  const r      = DOT_RADIUS[page.difficulty] || 5;
  const fs     = FONT_SIZE[page.difficulty]  || 8;

  const cx=250, cy=345, sc=0.88;
  const shapeName = PAGE_SHAPE[page.slug] || 'star';
  const shapeFn   = SHAPES[shapeName] || SHAPES.star;

  const outline = shapeFn(cx, cy, sc);
  const dots    = samplePath(outline, n);

  // Faint "answer" outline (ghost lines) — dashed, light gray
  const ghostD = outline.map((p,i) => (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'Z';

  // Numbered dot elements
  const dotEls = dots.map((p,i) => {
    const num = i+1;
    const dx  = (p[0]-cx)/3;  // slight offset for label to avoid overlap
    const dy  = (p[1]-cy)/3;
    const lx  = p[0] + (dx >= 0 ? r+3 : -r-3);
    const ly  = p[1] + (dy >= 0 ? r+3 : -r-3);
    const anchor = dx >= 0 ? 'start' : 'end';
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="white" stroke="${color}" stroke-width="1.8"/>
<text x="${lx.toFixed(1)}" y="${(ly+fs*0.35).toFixed(1)}" font-family="Nunito,sans-serif" font-size="${fs}" font-weight="800" fill="#1a1a1a" text-anchor="${anchor}">${num}</text>`;
  }).join('\n');

  const diffN = {easy:1,medium:2,hard:3}[page.difficulty]||1;
  const stars = [0,1,2].map(i =>
    `<text x="${224+i*20}" y="52" font-size="15" fill="${i<diffN?color:'#d1d5db'}" font-family="sans-serif">★</text>`
  ).join('');

  return `<svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
<rect width="500" height="650" fill="white"/>
<rect width="500" height="72" fill="${color}"/>
<text x="18" y="29" font-family="Nunito,sans-serif" font-size="10" fill="white" font-weight="800" opacity=".85">${emoji} ${label.toUpperCase()} · CONNECT THE DOTS</text>
<text x="18" y="57" font-family="'Fredoka One',Nunito,sans-serif" font-size="21" fill="white" font-weight="900">${page.title}</text>
${stars}
<text x="284" y="52" font-family="Nunito,sans-serif" font-size="9" fill="white" opacity=".7">${page.difficulty.toUpperCase()} · Ages ${page.age}</text>
<text x="488" y="52" font-family="Nunito,sans-serif" font-size="8" fill="white" opacity=".6" text-anchor="end">chartkids.com</text>
<!-- Ghost outline (faint answer hint) -->
<path d="${ghostD}" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4,3"/>
<!-- Numbered dots -->
${dotEls}
<!-- Footer instruction -->
<text x="250" y="618" font-family="Nunito,sans-serif" font-size="11" fill="#475569" text-anchor="middle" font-weight="700">Connect the dots in order from 1 to ${n}!</text>
<text x="250" y="643" font-family="Nunito,sans-serif" font-size="8" fill="#94a3b8" text-anchor="middle">Free printable · chartkids.com/dots/${page.slug}/</text>
</svg>`;
}

// ── HTML page ─────────────────────────────────────────────────────────────────
function makeHTML(page, svg) {
  const color = CAT_COLORS[page.category] || '#06b6d4';
  const label = CAT_LABELS[page.category] || page.category;
  const emoji = CAT_EMOJIS[page.category] || '🎯';
  const diffLabel = {easy:'Easy 😊',medium:'Medium 🤔',hard:'Hard 🧠'}[page.difficulty]||page.difficulty;
  const diffStars = {easy:'★☆☆',medium:'★★☆',hard:'★★★'}[page.difficulty]||'★☆☆';
  const n = DOTS_COUNT[page.difficulty]||20;
  const relCats = Object.entries(CAT_LABELS).map(([k,v])=>
    `<a href="/dots/category/${k}/" class="rel-card"><div class="rel-em">${CAT_EMOJIS[k]}</div><div class="rel-name">${v}</div></a>`
  ).join('');
  const minSvg = svg.replace(/\n/g,' ').replace(/\s{2,}/g,' ');
  const {title,slug,age,difficulty,category} = page;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Free Printable Connect the Dots for Kids | ChartKids</title>
<meta name="description" content="Free printable ${title.toLowerCase()} connect the dots for kids ages ${age}. ${n} dots, ${difficulty} level. Print instantly, no sign-up needed.">
<link rel="canonical" href="https://chartkids.com/dots/${slug}/">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<style>
.activity-badge{display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;border-radius:20px;padding:4px 12px;font-size:.8rem;font-weight:800;color:#475569;margin-bottom:8px}
.activity-badge span{background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:.75rem}
.diff-stars{color:${color};font-size:1.1rem;letter-spacing:2px}
.dots-tip{background:#f8fafc;border-left:3px solid ${color};padding:10px 14px;border-radius:0 8px 8px 0;font-size:.82rem;color:#475569;margin:12px 0}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
  <a href="/" class="logo">🎨 Chart<em>Kids</em></a>
  <nav class="main-nav">
    <a href="/downloads/coloring/">Coloring</a>
    <a href="/maze/">Mazes</a>
    <a href="/dots/" class="active">Connect Dots</a>
    <a href="/blog/">Blog</a>
  </nav>
</div></header>
<main class="container page-layout">
  <div class="page-main">
    <div class="activity-badge">${emoji} ${label} <span>CONNECT THE DOTS</span></div>
    <h1>${title}</h1>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <span class="diff-stars">${diffStars}</span>
      <span class="pill" style="background:${color}20;color:${color}">${diffLabel}</span>
      <span class="pill">Ages ${age}</span>
      <span class="pill">${n} dots</span>
    </div>
    <div class="dots-tip">✏️ <strong>How to play:</strong> Connect the dots from <strong>1</strong> to <strong>${n}</strong> in order to reveal the picture!</div>
    <div class="print-area" style="max-width:520px;margin:0 auto">${minSvg}</div>
    <div class="page-actions">
      <button onclick="printPage()" class="btn-print">🖨️ Print</button>
      <a href="/dots/category/${category}/" class="btn-secondary">More ${label} Dots</a>
    </div>
  </div>
  <aside class="page-sidebar">
    <h3>Connect the Dots</h3>
    <div class="rel-grid">${relCats}</div>
    <div class="sidebar-promo">
      <h4>Also try:</h4>
      <a href="/downloads/coloring/" class="promo-link">🎨 Coloring Pages</a>
      <a href="/maze/" class="promo-link">🌀 Mazes</a>
      <a href="/numbers/" class="promo-link">🔢 Color by Numbers</a>
    </div>
  </aside>
</main>
<footer class="site-footer"><div class="container footer-inner">
  <p>© 2025 ChartKids · Free educational printables for kids</p>
  <nav><a href="/downloads/coloring/">Coloring</a><a href="/maze/">Mazes</a><a href="/dots/">Connect Dots</a></nav>
</div></footer>
<script>
function printPage(){
  var svg=document.querySelector('.print-area').innerHTML;
  var w=window.open('','_blank','width=816,height=1056');
  if(!w){window.print();return;}
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} | ChartKids<\\/title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&family=Fredoka+One&display=swap" rel="stylesheet">'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100vh;overflow:hidden;background:white}'
    +'.page{display:flex;flex-direction:column;height:100vh}'
    +'.ph{flex:none;display:flex;align-items:center;justify-content:space-between;padding:7px 18px 6px;border-bottom:2.5px solid #1a1a1a}'
    +'.ph-logo{font-family:"Fredoka One",cursive;font-size:1.1rem;color:#7c3aed}'
    +'.ph-logo em{color:#1a1a1a;font-style:normal}'
    +'.ph-title{font-family:"Fredoka One",cursive;font-size:.95rem}'
    +'.ph-url{font-size:.65rem;font-weight:800;color:#94a3b8}'
    +'.ps{flex:1;overflow:hidden;padding:6px 16px 4px;display:flex;align-items:center;justify-content:center}'
    +'.ps svg{width:100%;height:100%;max-width:100%;max-height:100%;display:block}'
    +'.pf{flex:none;display:flex;justify-content:space-between;padding:5px 18px;border-top:1.5px solid #e2e8f0;font-size:.62rem;color:#94a3b8}'
    +'@page{size:letter portrait;margin:.2in .25in}@media print{html,body{height:100vh;overflow:hidden}}'
    +'<\\/style><\\/head><body><div class="page">'
    +'<div class="ph"><div class="ph-logo">🎨 Chart<em>Kids<\\/em><\\/div>'
    +'<div class="ph-title">${title}<\\/div>'
    +'<div class="ph-url">chartkids.com<\\/div><\\/div>'
    +'<div class="ps">'+svg+'<\\/div>'
    +'<div class="pf"><span>Connect dots 1→${n} · chartkids.com<\\/span>'
    +'<span>chartkids.com/dots/${slug}/<\\/span><\\/div>'
    +'<\\/div><\\/body><\\/html>');
  w.document.close();
  setTimeout(function(){w.print();},500);
}
</script>
</body></html>`;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
function addToSitemap(urls) {
  if (!fs.existsSync(SITEMAP)) return;
  let xml = fs.readFileSync(SITEMAP, 'utf8');
  const existing = new Set((xml.match(/<loc>[^<]+<\/loc>/g)||[]).map(x=>x));
  const entries = urls
    .filter(u => !existing.has(`<loc>https://chartkids.com${u}</loc>`))
    .map(u => `  <url><loc>https://chartkids.com${u}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('\n');
  if (entries) {
    xml = xml.replace('</urlset>', entries + '\n</urlset>');
    fs.writeFileSync(SITEMAP, xml);
    console.log(`  ✓ sitemap +${urls.length} URLs`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));
  fs.mkdirSync(SVG_DIR, { recursive: true });

  let filtered = pages;
  if (ID_FILTER)  filtered = filtered.filter(p => p.id === ID_FILTER);
  if (CAT_FILTER) filtered = filtered.filter(p => p.category === CAT_FILTER);

  let built=0, skipped=0, sitemapUrls=[];

  for (const page of filtered) {
    const pageDir  = path.join(OUT_DIR, page.slug);
    const htmlPath = path.join(pageDir, 'index.html');
    const svgPath  = path.join(SVG_DIR, `${page.slug}.svg`);

    if (!FORCE && fs.existsSync(htmlPath)) {
      process.stdout.write(`  skip  [${page.id}] ${page.slug}\n`);
      skipped++; continue;
    }

    process.stdout.write(`  build [${page.id}] ${page.title}\n`);
    const svg  = makeDotsSVG(page);
    const html = makeHTML(page, svg);

    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(htmlPath, html);
    fs.writeFileSync(svgPath, svg);
    sitemapUrls.push(`/dots/${page.slug}/`);
    built++;
  }

  if (sitemapUrls.length) addToSitemap(sitemapUrls);
  console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
}

main();
