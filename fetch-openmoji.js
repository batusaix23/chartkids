#!/usr/bin/env node
// fetch-openmoji.js — Downloads OpenMoji black outline SVGs + programmatic backgrounds
// Free CC BY-SA 4.0 license. No API key needed.
// Usage: node fetch-openmoji.js [--force] [--id=1] [--category=animals] [--limit=10]

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const SVG_DIR = path.join(BASE_DIR, 'generated', 'svgs', 'coloring');
const METADATA_FILE = path.join(BASE_DIR, 'generated', 'metadata-coloring-all.json');
const PAGES_FILE = path.join(BASE_DIR, 'master-coloring-pages-300.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 999;
const ID_FILTER = parseInt((args.find(a => a.startsWith('--id=')) || '').split('=')[1]) || null;
const CAT_FILTER = (args.find(a => a.startsWith('--category=')) || '').split('=')[1];
const DELAY_MS = 200;

// OpenMoji hexcode mapping for all 305 pages
const EMOJI_MAP = {
  // Animals
  'lion-smiling-coloring-page':         '1F981',
  'baby-elephant-coloring-page':        '1F418',
  'tall-giraffe-coloring-page':         '1F992',
  'hanging-monkey-coloring-page':       '1F412',
  'friendly-bear-coloring-page':        '1F43B',
  'curious-fox-coloring-page':          '1F98A',
  'howling-wolf-coloring-page':         '1F43A',
  'jumping-rabbit-coloring-page':       '1F430',
  'squirrel-with-acorn-coloring-page':  '1F43F-FE0F',
  'panda-eating-bamboo-coloring-page':  '1F43C',
  'koala-in-tree-coloring-page':        '1F428',
  'happy-hippo-coloring-page':          '1F99B',
  'friendly-rhino-coloring-page':       '1F98F',
  'running-zebra-coloring-page':        '1F993',
  'camel-in-desert-coloring-page':      '1F42A',
  'kangaroo-with-baby-coloring-page':   '1F998',
  'hanging-sloth-coloring-page':        '1F9A5',
  'swimming-otter-coloring-page':       '1F9A6',
  'cute-hedgehog-coloring-page':        '1F994',
  'beaver-building-coloring-page':      '1F9AB',
  'baby-tiger-coloring-page':           '1F42F',
  'leopard-coloring-page':              '1F406',
  'gorilla-coloring-page':              '1F98D',
  'chimpanzee-coloring-page':           '1F412',
  'meerkat-coloring-page':              '1F9A1',
  'buffalo-coloring-page':              '1F9AC',
  'antelope-coloring-page':             '1F98C',
  'moose-coloring-page':                '1FACE',
  'reindeer-coloring-page':             '1F98C',
  'yak-coloring-page':                  '1F402',
  'friendly-bat-coloring-page':         '1F987',
  'raccoon-coloring-page':              '1F99D',
  'opossum-coloring-page':              '1F400',
  'lemur-coloring-page':                '1F412',
  'tapir-coloring-page':                '1F416',
  'armadillo-coloring-page':            '1F9A1',
  'polar-bear-coloring-page':           '1F43B-200D-2744-FE0F',
  'emperor-penguin-coloring-page':      '1F427',
  'baby-seal-coloring-page':            '1F9AD',
  'walrus-coloring-page':               '1F9AD',
  'jumping-dolphin-coloring-page':      '1F42C',
  'orca-coloring-page':                 '1F40B',
  'whale-coloring-page':                '1F433',
  'friendly-shark-coloring-page':       '1F988',
  'seahorse-coloring-page':             '1F40C',
  'smiling-octopus-coloring-page':      '1F419',
  'starfish-coloring-page':             '2B50',
  'sea-turtle-coloring-page':           '1F422',
  'cartoon-jellyfish-coloring-page':    '1FABC',
  'tropical-fish-coloring-page':        '1F420',
  // Dinosaurs
  'baby-t-rex-coloring-page':           '1F996',
  'triceratops-coloring-page':          '1F995',
  'stegosaurus-coloring-page':          '1F995',
  'velociraptor-coloring-page':         '1F996',
  'brontosaurus-coloring-page':         '1F995',
  'parasaurolophus-coloring-page':      '1F995',
  'ankylosaurus-coloring-page':         '1F995',
  'pterodactyl-coloring-page':          '1F9A2',
  't-rex-playing-soccer-coloring-page': '1F996',
  'dinosaur-astronaut-coloring-page':   '1F996',
  'dinosaur-pirate-coloring-page':      '1F996',
  'dinosaur-firefighter-coloring-page': '1F996',
  'dinosaur-builder-coloring-page':     '1F995',
  'dinosaur-on-bicycle-coloring-page':  '1F995',
  'dinosaur-on-skateboard-coloring-page':'1F996',
  'dinosaur-family-coloring-page':      '1F995',
  'dinosaur-with-volcano-coloring-page':'1F996',
  'explorer-dinosaur-coloring-page':    '1F995',
  'fishing-dinosaur-coloring-page':     '1F996',
  'dinosaur-in-jungle-coloring-page':   '1F995',
  'sleeping-dinosaur-coloring-page':    '1F996',
  'dinosaur-with-egg-coloring-page':    '1F95A',
  'christmas-dinosaur-coloring-page':   '1F996',
  'halloween-dinosaur-coloring-page':   '1F996',
  'birthday-dinosaur-coloring-page':    '1F995',
  // Vehicles
  'compact-car-coloring-page':          '1F697',
  'fire-truck-coloring-page':           '1F692',
  'police-car-coloring-page':           '1F693',
  'ambulance-coloring-page':            '1F691',
  'excavator-coloring-page':            '1F3D7-FE0F',
  'bulldozer-coloring-page':            '1F69C',
  'tractor-coloring-page':              '1F69C',
  'school-bus-coloring-page':           '1F68C',
  'train-coloring-page':                '1F682',
  'subway-train-coloring-page':         '1F687',
  'commercial-airplane-coloring-page':  '2708-FE0F',
  'helicopter-coloring-page':           '1F681',
  'space-rocket-coloring-page':         '1F680',
  'submarine-coloring-page':            '1F6A2',
  'pirate-ship-coloring-page':          '26F5',
  'sailboat-coloring-page':             '26F5',
  'motorcycle-coloring-page':           '1F3CD-FE0F',
  'bicycle-coloring-page':              '1F6B2',
  'scooter-coloring-page':              '1F6F5',
  'monster-truck-coloring-page':        '1F69B',
  'garbage-truck-coloring-page':        '1F69A',
  'moving-truck-coloring-page':         '1F69A',
  'ice-cream-truck-coloring-page':      '1F68D',
  'crane-coloring-page':                '1F3D7-FE0F',
  'taxi-coloring-page':                 '1F695',
  'race-car-coloring-page':             '1F3CE-FE0F',
  'formula-1-car-coloring-page':        '1F3CE-FE0F',
  'christmas-train-coloring-page':      '1F682',
  'rescue-plane-coloring-page':         '2708-FE0F',
  'construction-truck-coloring-page':   '1F69B',
  // Space
  'astronaut-waving-coloring-page':     '1F9D1-200D-1F680',
  'rocket-launching-coloring-page':     '1F680',
  'space-station-coloring-page':        '1F6F8',
  'planet-earth-coloring-page':         '1F30D',
  'saturn-planet-coloring-page':        '1FA90',
  'solar-system-coloring-page':         '1FA90',
  'friendly-alien-coloring-page':       '1F47D',
  'space-robot-coloring-page':          '1F916',
  'astronaut-on-moon-coloring-page':    '1F9D1-200D-1F680',
  'mars-rover-coloring-page':           '1F6F8',
  'spaceship-coloring-page':            '1F6F8',
  'constellations-coloring-page':       '2B50',
  'comet-coloring-page':                '2604-FE0F',
  'asteroid-coloring-page':             '2604-FE0F',
  'cartoon-galaxy-coloring-page':       '1F30C',
  'boy-astronaut-coloring-page':        '1F9D1-200D-1F680',
  'girl-astronaut-coloring-page':       '1F9D1-200D-1F680',
  'dog-astronaut-coloring-page':        '1F415',
  'cat-astronaut-coloring-page':        '1F408',
  'space-party-coloring-page':          '1F389',
  // Superheroes
  'superhero-flying-coloring-page':     '1F9B8',
  'superheroine-flying-coloring-page':  '1F9B9',
  'boy-superhero-coloring-page':        '1F9B8',
  'girl-superhero-coloring-page':       '1F9B9',
  'team-of-heroes-coloring-page':       '1F9B8',
  'hero-saving-cat-coloring-page':      '1F9B8',
  'hero-on-bicycle-coloring-page':      '1F9B8',
  'eco-hero-coloring-page':             '1F9B8',
  'space-hero-coloring-page':           '1F9B8',
  'builder-hero-coloring-page':         '1F9B8',
  'firefighter-hero-coloring-page':     '1F9B8',
  'doctor-hero-coloring-page':          '1F9B8',
  'inventor-hero-coloring-page':        '1F9B8',
  'robot-hero-coloring-page':           '1F916',
  'hero-with-pet-coloring-page':        '1F9B8',
  'celebrating-hero-coloring-page':     '1F9B8',
  'christmas-hero-coloring-page':       '1F9B8',
  'halloween-hero-coloring-page':       '1F9B8',
  'sports-hero-coloring-page':          '1F9B8',
  'reading-hero-coloring-page':         '1F9B8',
  // Fantasy
  'smiling-princess-coloring-page':     '1F478',
  'reading-princess-coloring-page':     '1F478',
  'gardener-princess-coloring-page':    '1F478',
  'princess-with-unicorn-coloring-page':'1F984',
  'medieval-castle-coloring-page':      '1F3F0',
  'friendly-dragon-coloring-page':      '1F409',
  'fairy-godmother-coloring-page':      '1F9DA',
  'forest-fairy-coloring-page':         '1F9DA',
  'magic-unicorn-coloring-page':        '1F984',
  'royal-carriage-coloring-page':       '1F3C7',
  'kind-king-coloring-page':            '1F934',
  'kind-queen-coloring-page':           '1F478',
  'medieval-knight-coloring-page':      '1F9D9',
  'enchanted-castle-coloring-page':     '1F3F0',
  'magic-tower-coloring-page':          '1F3F0',
  'magic-wand-coloring-page':            '1FA84',
  'enchanted-forest-coloring-page':     '1F332',
  'royal-party-coloring-page':          '1F478',
  'flying-unicorn-coloring-page':       '1F984',
  'baby-dragon-coloring-page':          '1F409',
  'christmas-fairy-coloring-page':      '1F9DA',
  'princess-astronaut-coloring-page':   '1F478',
  'magic-mermaid-coloring-page':        '1F9DC',
  'underwater-palace-coloring-page':    '1F3F0',
  'royal-crown-coloring-page':          '1F451',
  // Jobs
  'firefighter-coloring-page':          '1F9D1-200D-1F692',
  'police-officer-coloring-page':       '1F46E',
  'doctor-coloring-page':               '1F9D1-200D-2695-FE0F',
  'dentist-coloring-page':              '1F9D1-200D-2695-FE0F',
  'veterinarian-coloring-page':         '1F9D1-200D-2695-FE0F',
  'teacher-coloring-page':              '1F9D1-200D-1F3EB',
  'scientist-coloring-page':            '1F9D1-200D-1F52C',
  'engineer-coloring-page':             '1F9D1-200D-1F527',
  'programmer-coloring-page':           '1F9D1-200D-1F4BB',
  'chef-coloring-page':                 '1F9D1-200D-1F373',
  'baker-coloring-page':                '1F9D1-200D-1F373',
  'farmer-coloring-page':               '1F9D1-200D-1F33E',
  'builder-coloring-page':              '1F9D1-200D-1F527',
  'pilot-coloring-page':                '1F9D1-200D-2708-FE0F',
  'astronaut-career-coloring-page':     '1F9D1-200D-1F680',
  'artist-coloring-page':               '1F9D1-200D-1F3A8',
  'musician-coloring-page':             '1F9D1-200D-1F3A4',
  'photographer-coloring-page':         '1F4F7',
  'carpenter-coloring-page':            '1F9D1-200D-1F527',
  'electrician-coloring-page':          '1F9D1-200D-1F527',
  'gardener-coloring-page':             '1F9D1-200D-1F33E',
  'delivery-person-coloring-page':      '1F9D1-200D-1F4BC',
  'librarian-coloring-page':            '1F9D1-200D-1F4BC',
  'park-ranger-coloring-page':          '1F9D1-200D-1F33E',
  'rescue-worker-coloring-page':        '1F9B8',
  // Sports
  'soccer-player-coloring-page':        '26BD',
  'basketball-player-coloring-page':    '1F3C0',
  'baseball-player-coloring-page':      '26BE',
  'tennis-player-coloring-page':        '1F3BE',
  'golfer-coloring-page':               '1F3CC-FE0F',
  'swimmer-coloring-page':              '1F3CA',
  'surfer-coloring-page':               '1F3C4',
  'skateboarder-coloring-page':         '1F6F9',
  'ice-skater-coloring-page':           '26F8-FE0F',
  'gymnast-coloring-page':              '1F938',
  'karate-kid-coloring-page':           '1F94B',
  'taekwondo-kid-coloring-page':        '1F94B',
  'cyclist-coloring-page':              '1F6B4',
  'track-runner-coloring-page':         '1F3C3',
  'rock-climber-coloring-page':         '1F9D7',
  'hockey-player-coloring-page':        '1F3D2',
  'rugby-player-coloring-page':         '1F3C9',
  'volleyball-player-coloring-page':    '1F3D0',
  'bowler-coloring-page':               '1F3AF',
  'sport-fisherman-coloring-page':      '1F3A3',
  // Food
  'happy-pizza-coloring-page':          '1F355',
  'fun-hamburger-coloring-page':        '1F354',
  'hot-dog-coloring-page':              '1F32D',
  'ice-cream-cone-coloring-page':       '1F366',
  'cupcake-coloring-page':              '1F9C1',
  'donut-coloring-page':                '1F369',
  'birthday-cake-coloring-page':        '1F382',
  'watermelon-coloring-page':           '1F349',
  'pineapple-coloring-page':            '1F34D',
  'apple-coloring-page':                '1F34E',
  'banana-coloring-page':               '1F34C',
  'strawberry-coloring-page':           '1F353',
  'grapes-coloring-page':               '1F347',
  'orange-coloring-page':               '1F34A',
  'mango-coloring-page':                '1F96D',
  'avocado-coloring-page':              '1F951',
  'healthy-salad-coloring-page':        '1F957',
  'fun-taco-coloring-page':             '1F32E',
  'fruit-smoothie-coloring-page':       '1F964',
  'chef-cooking-coloring-page':         '1F9D1-200D-1F373',
  // Nature
  'giant-tree-coloring-page':           '1F332',
  'forest-coloring-page':               '1F333',
  'mountains-coloring-page':            '26F0-FE0F',
  'waterfall-coloring-page':            '26F0-FE0F',
  'lake-coloring-page':                 '1F3DE-FE0F',
  'flower-garden-coloring-page':        '1F33A',
  'spring-scene-coloring-page':         '1F338',
  'summer-scene-coloring-page':         '2600-FE0F',
  'autumn-scene-coloring-page':         '1F342',
  'winter-scene-coloring-page':         '2744-FE0F',
  'rainy-day-coloring-page':            '1F327-FE0F',
  'sunny-day-coloring-page':            '2600-FE0F',
  'rainbow-coloring-page':              '1F308',
  'butterflies-in-garden-coloring-page':'1F98B',
  'bees-in-garden-coloring-page':       '1F41D',
  'volcano-coloring-page':              '1F30B',
  'desert-landscape-coloring-page':     '1F3DC-FE0F',
  'meadow-coloring-page':               '1F33F',
  'snow-scene-coloring-page':           '2744-FE0F',
  'wildflowers-coloring-page':          '1F337',
  // Holidays
  'christmas-tree-coloring-page':       '1F384',
  'santa-claus-coloring-page':          '1F385',
  'rudolph-reindeer-coloring-page':     '1F98C',
  'snowman-coloring-page':              '26C4',
  'halloween-pumpkin-coloring-page':    '1F383',
  'friendly-ghost-coloring-page':       '1F47B',
  'cute-witch-coloring-page':           '1F9D9-200D-2640-FE0F',
  'easter-rabbit-coloring-page':        '1F430',
  'easter-eggs-coloring-page':          '1F95A',
  'valentine-heart-coloring-page':      '2764-FE0F',
  'earth-day-coloring-page':            '1F30D',
  'mothers-day-coloring-page':          '1F490',
  'fathers-day-coloring-page':          '1F9D4',
  'birthday-party-coloring-page':       '1F389',
  'pinata-coloring-page':               '1F3EE',
  'fireworks-coloring-page':            '1F386',
  'tropical-party-coloring-page':       '1F334',
  'family-picnic-coloring-page':        '1F9FA',
  'carnival-coloring-page':             '1F3A1',
  'school-party-coloring-page':         '1F393',
  'kids-graduation-coloring-page':      '1F393',
  'summer-party-coloring-page':         '1F3D6-FE0F',
  'autumn-festival-coloring-page':      '1F342',
  'winter-festival-coloring-page':      '2744-FE0F',
  'family-celebration-coloring-page':   '1F389',
  // Pets & Insects
  'puppy-dog-coloring-page':            '1F415',
  'baby-cat-coloring-page':             '1F408',
  'hamster-coloring-page':              '1F439',
  'pet-rabbit-coloring-page':           '1F407',
  'pet-turtle-coloring-page':           '1F422',
  'pet-fish-coloring-page':             '1F41F',
  'parrot-coloring-page':               '1F99C',
  'canary-coloring-page':               '1F426',
  'bee-coloring-page':                  '1F41D',
  'ladybug-coloring-page':              '1F41E',
  'butterfly-coloring-page':            '1F98B',
  'ant-coloring-page':                  '1F41C',
  'dragonfly-coloring-page':            '1FAB4',
  'beetle-coloring-page':               '1FAB2',
  'caterpillar-coloring-page':          '1F41B',
  'bee-collecting-pollen-coloring-page':'1F41D',
  'butterfly-on-flower-coloring-page':  '1F98B',
  'kitten-playing-coloring-page':       '1F408',
  'puppy-playing-coloring-page':        '1F415',
  'puppy-with-ball-coloring-page':      '1F415',
  'kitten-sleeping-coloring-page':      '1F408',
  'hamster-on-wheel-coloring-page':     '1F439',
  'rabbit-with-carrot-coloring-page':   '1F407',
  'turtle-walking-coloring-page':       '1F422',
  'fun-fish-bowl-coloring-page':        '1F41F',
};

// Programmatic backgrounds per category
function makeBg(category) {
  const rand = (seed, min, max) => min + Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % (max - min) | 0;

  const clouds = (n, yBase) => Array.from({length: n}, (_, i) => {
    const cx = 40 + i * (460 / n);
    const cy = yBase + rand(i, -15, 15);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rand(i+10,30,55)}" ry="${rand(i+20,14,24)}" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="${cx+rand(i+30,10,25)}" cy="${cy-rand(i+40,4,14)}" rx="${rand(i+50,20,38)}" ry="${rand(i+60,12,20)}" fill="white" stroke="#1a1a1a" stroke-width="2"/>`;
  }).join('');

  const stars = (n) => Array.from({length: n}, (_, i) => {
    const x = rand(i * 7, 10, 490); const y = rand(i * 13, 10, 300);
    const r = i % 5 === 0 ? 2.5 : 1.5;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a1a1a"/>`;
  }).join('');

  const grassTufts = (n) => Array.from({length: n}, (_, i) => {
    const x = 15 + i * (470 / n); const y = 510 + rand(i, 0, 20);
    return `<path d="M${x},${y} C${x-4},${y-18} ${x+4},${y-22} ${x+8},${y-6}" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M${x+6},${y} C${x+2},${y-14} ${x+12},${y-18} ${x+13},${y-4}" fill="white" stroke="#1a1a1a" stroke-width="2"/>`;
  }).join('');

  const sun = (cx, cy, r) => {
    const rays = Array.from({length: 8}, (_, i) => {
      const a = (i * 45) * Math.PI / 180;
      return `<line x1="${(cx + (r+6)*Math.cos(a)).toFixed(1)}" y1="${(cy + (r+6)*Math.sin(a)).toFixed(1)}" x2="${(cx + (r+18)*Math.cos(a)).toFixed(1)}" y2="${(cy + (r+18)*Math.sin(a)).toFixed(1)}" stroke="#1a1a1a" stroke-width="2.5"/>`;
    }).join('');
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>${rays}`;
  };

  const bgs = {
    animals: `
<!-- Ground -->
<path d="M0,520 Q125,500 250,518 Q375,535 500,518 L500,650 L0,650 Z" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${grassTufts(14)}
<!-- Clouds -->
${clouds(3, 65)}
<!-- Sun -->
${sun(440, 50, 30)}
<!-- Tree right -->
<rect x="430" y="390" width="14" height="130" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="437" cy="372" rx="32" ry="36" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="437" cy="348" rx="22" ry="26" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Tree left -->
<rect x="50" y="400" width="12" height="120" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="56" cy="384" rx="26" ry="30" fill="white" stroke="#1a1a1a" stroke-width="2"/>`,

    dinosaurs: `
<!-- Mountains -->
<polygon points="0,380 110,180 220,380" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<polygon points="180,380 320,140 460,380" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<polygon points="360,380 460,210 500,380" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Volcano smoke -->
<circle cx="320" cy="110" r="22" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<circle cx="335" cy="84" r="16" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<circle cx="325" cy="62" r="11" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Ground -->
<path d="M0,500 Q125,485 250,500 Q375,515 500,500 L500,650 L0,650 Z" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Ferns -->
<path d="M30,500 C10,468 50,452 42,488" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M42,500 C62,468 22,452 30,488" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M440,500 C420,468 460,452 452,488" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M452,500 C472,468 432,452 440,488" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Palm tree -->
<rect x="76" y="380" width="10" height="120" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M81,380 C60,355 30,360 45,375 C30,345 10,355 35,365 C55,340 80,350 81,380" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M81,380 C102,355 132,360 117,375 C132,345 152,355 127,365 C107,340 82,350 81,380" fill="white" stroke="#1a1a1a" stroke-width="2"/>`,

    vehicles: `
<!-- Road -->
<rect x="0" y="545" width="500" height="105" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Lane dashes -->
${Array.from({length: 6}, (_, i) => `<rect x="${i*88}" y="592" width="55" height="9" rx="3" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}
<!-- Sidewalk -->
<rect x="0" y="530" width="500" height="18" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Sky/Clouds -->
${clouds(3, 72)}
<!-- Buildings -->
<rect x="15" y="340" width="65" height="195" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:6},(_, i)=>`<rect x="${22+(i%3)*18}" y="${355+Math.floor(i/3)*45}" width="11" height="14" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}
<rect x="420" y="310" width="72" height="225" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:6},(_, i)=>`<rect x="${427+(i%3)*19}" y="${325+Math.floor(i/3)*45}" width="11" height="14" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}`,

    space: `
<!-- Stars -->
${stars(55)}
<!-- Saturn -->
<ellipse cx="420" cy="80" rx="38" ry="22" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="420" cy="80" rx="20" ry="20" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="420" cy="80" rx="52" ry="9" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Small planet -->
<circle cx="65" cy="100" r="24" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<line x1="43" y1="100" x2="87" y2="100" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Moon crescent -->
<circle cx="60" cy="560" r="30" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<circle cx="72" cy="553" r="24" fill="white" stroke="white" stroke-width="0"/>
<!-- Shooting star -->
<line x1="150" y1="40" x2="200" y2="70" stroke="#1a1a1a" stroke-width="2"/>
<circle cx="148" cy="39" r="3" fill="#1a1a1a"/>`,

    superheroes: `
<!-- City skyline -->
<rect x="0" y="445" width="75" height="210" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="85" y="470" width="58" height="185" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="155" y="410" width="68" height="245" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="340" y="430" width="70" height="225" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="420" y="455" width="80" height="200" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:12},(_, i)=>`<rect x="${8+(i%4)*15}" y="${460+Math.floor(i/4)*35}" width="10" height="13" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}
<!-- Clouds -->
${clouds(2, 75)}
<!-- Speed lines -->
<line x1="50" y1="200" x2="185" y2="240" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="10,5"/>
<line x1="30" y1="240" x2="180" y2="265" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="10,5"/>
<line x1="60" y1="280" x2="182" y2="290" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="10,5"/>`,

    fantasy: `
<!-- Night sky -->
${stars(25)}
<!-- Moon -->
<circle cx="430" cy="58" r="34" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
<circle cx="447" cy="50" r="26" fill="white" stroke="white"/>
<!-- Castle tower left -->
<rect x="0" y="380" width="85" height="275" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:4},(_, i)=>`<rect x="${i*18}" y="365" width="13" height="20" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}
<rect x="28" y="420" width="28" height="35" rx="14" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Castle tower right -->
<rect x="415" y="380" width="85" height="275" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:4},(_, i)=>`<rect x="${416+i*18}" y="365" width="13" height="20" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}
<rect x="443" y="420" width="28" height="35" rx="14" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Ground with flowers -->
<path d="M0,540 Q125,525 250,540 Q375,555 500,540 L500,650 L0,650 Z" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${Array.from({length:7},(_, i)=>`<circle cx="${55+i*60}" cy="538" r="7" fill="white" stroke="#1a1a1a" stroke-width="2"/><line x1="${55+i*60}" y1="545" x2="${55+i*60}" y2="565" stroke="#1a1a1a" stroke-width="2"/>`).join('')}`,

    jobs: `
<!-- Room wall -->
<rect x="0" y="0" width="500" height="540" fill="white" stroke="none"/>
<!-- Floor -->
<rect x="0" y="538" width="500" height="112" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Floor tiles -->
${Array.from({length:5},(_, i)=>`<line x1="${i*100}" y1="538" x2="${i*100}" y2="650" stroke="#1a1a1a" stroke-width="1"/>`).join('')}
<!-- Window with view -->
<rect x="370" y="70" width="100" height="130" rx="5" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
<line x1="420" y1="70" x2="420" y2="200" stroke="#1a1a1a" stroke-width="1.5"/>
<line x1="370" y1="135" x2="470" y2="135" stroke="#1a1a1a" stroke-width="1.5"/>
<ellipse cx="395" cy="105" rx="18" ry="10" fill="white" stroke="#1a1a1a" stroke-width="1"/>
<ellipse cx="444" cy="112" rx="14" ry="8" fill="white" stroke="#1a1a1a" stroke-width="1"/>
<!-- Cabinet/shelf -->
<rect x="20" y="280" width="80" height="120" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<line x1="20" y1="340" x2="100" y2="340" stroke="#1a1a1a" stroke-width="1.5"/>`,

    sports: `
<!-- Sports field -->
<rect x="0" y="490" width="500" height="160" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Field lines -->
<line x1="250" y1="490" x2="250" y2="650" stroke="#1a1a1a" stroke-width="1.5"/>
<circle cx="250" cy="570" r="55" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<rect x="185" y="490" width="130" height="55" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Crowd stands -->
<rect x="0" y="390" width="500" height="102" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
${Array.from({length:5},(_, i)=>`<line x1="0" y1="${395+i*20}" x2="500" y2="${395+i*20}" stroke="#1a1a1a" stroke-width="1"/>`).join('')}
<!-- Clouds -->
${clouds(2, 68)}`,

    food: `
<!-- Table -->
<rect x="25" y="535" width="450" height="22" rx="5" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
<rect x="55" y="555" width="20" height="75" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="425" y="555" width="20" height="75" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Plate ring -->
<ellipse cx="250" cy="538" rx="195" ry="13" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<ellipse cx="250" cy="538" rx="175" ry="10" fill="none" stroke="#1a1a1a" stroke-width="1"/>
<!-- Fork -->
<rect x="52" y="440" width="6" height="85" rx="2" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<rect x="47" y="440" width="4" height="28" rx="2" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<rect x="56" y="440" width="4" height="28" rx="2" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Knife -->
<rect x="442" y="440" width="6" height="85" rx="2" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M442,440 Q452,455 442,468" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Decorative stars -->
${Array.from({length:8},(_, i)=>{const a=(i*45)*Math.PI/180,cx=250+215*Math.cos(a),cy=325+175*Math.sin(a);return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="4" fill="white" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${(cx-7).toFixed(0)}" y1="${cy.toFixed(0)}" x2="${(cx+7).toFixed(0)}" y2="${cy.toFixed(0)}" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${cx.toFixed(0)}" y1="${(cy-7).toFixed(0)}" x2="${cx.toFixed(0)}" y2="${(cy+7).toFixed(0)}" stroke="#1a1a1a" stroke-width="1.5"/>`;}).join('')}`,

    nature: `
<!-- Mountains -->
<polygon points="0,370 105,195 210,370" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<polygon points="185,370 315,148 445,370" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<polygon points="380,370 460,215 500,370" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Ground -->
<path d="M0,500 Q125,483 250,500 Q375,517 500,500 L500,650 L0,650 Z" fill="white" stroke="#1a1a1a" stroke-width="2"/>
${grassTufts(12)}
<!-- Sun -->
${sun(55, 52, 28)}
<!-- Clouds -->
${clouds(3, 72)}
<!-- Flowers on ground -->
${Array.from({length:6},(_, i)=>`<circle cx="${60+i*78}" cy="502" r="7" fill="white" stroke="#1a1a1a" stroke-width="2"/><line x1="${60+i*78}" y1="509" x2="${60+i*78}" y2="528" stroke="#1a1a1a" stroke-width="2"/><ellipse cx="${60+i*78-7}" cy="515" rx="6" ry="4" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`).join('')}`,

    holidays: `
<!-- Festive snowflakes/stars -->
${Array.from({length:14},(_, i)=>{const x=20+(i*35)%480,y=18+(i*47)%220;return `<circle cx="${x}" cy="${y}" r="2.5" fill="white" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${x-9}" y1="${y}" x2="${x+9}" y2="${y}" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${x}" y1="${y-9}" x2="${x}" y2="${y+9}" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${x-6}" y1="${y-6}" x2="${x+6}" y2="${y+6}" stroke="#1a1a1a" stroke-width="1.5"/><line x1="${x+6}" y1="${y-6}" x2="${x-6}" y2="${y+6}" stroke="#1a1a1a" stroke-width="1.5"/>`;}).join('')}
<!-- Ground/floor -->
<rect x="0" y="560" width="500" height="90" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Gift left -->
<rect x="22" y="492" width="52" height="46" rx="3" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<line x1="48" y1="492" x2="48" y2="538" stroke="#1a1a1a" stroke-width="2"/>
<path d="M48,492 C36,480 30,472 48,476 C66,472 60,480 48,492" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Gift right -->
<rect x="426" y="492" width="52" height="46" rx="3" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<line x1="452" y1="492" x2="452" y2="538" stroke="#1a1a1a" stroke-width="2"/>
<path d="M452,492 C440,480 434,472 452,476 C470,472 464,480 452,492" fill="white" stroke="#1a1a1a" stroke-width="1.5"/>`,

    pets: `
<!-- Home interior -->
<!-- Wall -->
<rect x="0" y="0" width="500" height="545" fill="white" stroke="none"/>
<!-- Floor -->
<rect x="0" y="543" width="500" height="107" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<!-- Rug -->
<ellipse cx="250" cy="553" rx="195" ry="32" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="250" cy="553" rx="158" ry="24" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<ellipse cx="250" cy="553" rx="108" ry="16" fill="none" stroke="#1a1a1a" stroke-width="1"/>
<!-- Ball toy -->
<circle cx="72" cy="520" r="22" fill="white" stroke="#1a1a1a" stroke-width="2"/>
<path d="M54,510 Q72,525 90,510" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<path d="M54,530 Q72,515 90,530" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<!-- Window -->
<rect x="376" y="58" width="100" height="125" rx="5" fill="white" stroke="#1a1a1a" stroke-width="2.5"/>
<line x1="426" y1="58" x2="426" y2="183" stroke="#1a1a1a" stroke-width="1.5"/>
<line x1="376" y1="120" x2="476" y2="120" stroke="#1a1a1a" stroke-width="1.5"/>
<ellipse cx="400" cy="92" rx="16" ry="9" fill="white" stroke="#1a1a1a" stroke-width="1"/>`,
  };

  return bgs[category] || bgs.nature;
}

function fetchUrl(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: {'User-Agent':'ChartKids/1.0'} }, res => {
      if ([301,302,307].includes(res.statusCode) && redirects > 0 && res.headers.location)
        return fetchUrl(res.headers.location, redirects - 1).then(resolve).catch(reject);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function processSVG(raw, category) {
  const inner = raw.replace(/<\?xml[^>]*>/g,'').replace(/<!DOCTYPE[^>]*>/g,'').trim();
  const m = inner.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!m) return null;

  // Scale: emoji 72x72 → ~370x370 centered in 500x650
  // Target stroke 4px → in 72-unit space = 4 * (72/370) ≈ 0.78
  const SCALE = 5.14;
  const SW_FACTOR = 1 / SCALE;
  let content = m[1]
    .replace(/stroke="#000(?:000)?"/g, 'stroke="#1a1a1a"')
    .replace(/stroke="black"/g, 'stroke="#1a1a1a"')
    .replace(/fill="#000(?:000)?"/g, 'fill="#1a1a1a"')
    .replace(/fill="black"/g, 'fill="#1a1a1a"')
    .replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(parseFloat(w) * SW_FACTOR).toFixed(3)}"`);

  const tx = ((500 - 72 * SCALE) / 2).toFixed(1);
  const ty = ((650 - 72 * SCALE) / 2 - 25).toFixed(1);

  return `<svg viewBox="0 0 500 650" xmlns="http://www.w3.org/2000/svg">
<rect width="500" height="650" fill="white"/>
${makeBg(category)}
<g transform="translate(${tx},${ty}) scale(${SCALE})">
${content}
</g>
</svg>`;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const pages = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));
  const metadata = fs.existsSync(METADATA_FILE) ? JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8')) : {};
  fs.mkdirSync(SVG_DIR, { recursive: true });

  let filtered = pages;
  if (ID_FILTER) filtered = filtered.filter(p => p.id === ID_FILTER);
  if (CAT_FILTER) filtered = filtered.filter(p => p.category === CAT_FILTER);

  let done = 0, skipped = 0, errored = [];

  for (const page of filtered) {
    if (done >= LIMIT) break;
    const svgPath = path.join(SVG_DIR, `${page.slug}.svg`);
    if (!FORCE && fs.existsSync(svgPath)) {
      process.stdout.write(`  skip [${page.id}] ${page.slug}\n`);
      skipped++; continue;
    }

    const hex = EMOJI_MAP[page.slug];
    if (!hex) {
      process.stdout.write(`  MISS [${page.id}] no mapping: ${page.slug}\n`);
      errored.push(page.id); done++; continue;
    }

    const hexUpper = hex.toUpperCase();
    const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/black/svg/${hexUpper}.svg`;
    process.stdout.write(`  get  [${page.id}] ${page.title}\n`);

    try {
      let raw = await fetchUrl(url);

      // Fallback: try primary hex if compound emoji not found
      if (!raw.includes('<svg') || raw.includes('404') || raw.length < 100) {
        const primary = hex.split('-')[0].toUpperCase();
        raw = await fetchUrl(`https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/black/svg/${primary}.svg`);
      }

      if (!raw.includes('<svg')) throw new Error('no SVG content');

      const processed = processSVG(raw, page.category);
      if (!processed) throw new Error('processing failed');

      fs.writeFileSync(svgPath, processed);
      metadata[`coloring/${page.slug}`] = {
        id: page.id, title: page.title, category: page.category,
        slug: page.slug, generated: new Date().toISOString(), source: 'openmoji'
      };
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
      process.stdout.write(`  ✓    [${page.id}] saved\n`);
      done++;
      await sleep(DELAY_MS);

    } catch(err) {
      process.stdout.write(`  ERR  [${page.id}] ${err.message}\n`);
      errored.push(page.id); done++;
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n✓ Done: ${done} | Skipped: ${skipped} | Errors: ${errored.length}`);
  if (errored.length) console.log('  Failed IDs:', errored.join(', '));
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
