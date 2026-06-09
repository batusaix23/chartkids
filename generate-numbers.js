'use strict';
const fs   = require('fs');
const path = require('path');
const pages = require('./master-numbers-72.json');

const P = [null,
  {h:'#FF3333',n:'Rojo'},       // 1
  {h:'#FF8800',n:'Naranja'},    // 2
  {h:'#FFDD00',n:'Amarillo'},   // 3
  {h:'#77CC33',n:'V. Lima'},    // 4
  {h:'#228833',n:'Verde'},      // 5
  {h:'#66CCFF',n:'Azul Cla.'},  // 6
  {h:'#2244CC',n:'Azul'},       // 7
  {h:'#9922CC',n:'Morado'},     // 8
  {h:'#FF77BB',n:'Rosa'},       // 9
  {h:'#7B4F2E',n:'Café'},       // 10
  {h:'#F5F5F5',n:'Blanco'},     // 11
  {h:'#AAAAAA',n:'Gris'},       // 12
  {h:'#FFCC88',n:'Durazno'},    // 13
  {h:'#BBDDFF',n:'Celeste'},    // 14
  {h:'#AAFFAA',n:'V. Menta'},   // 15
  {h:'#33CCAA',n:'Turquesa'},   // 16
];

// Each shape returns array of {el, n, lx, ly}
// el = SVG element string, n = color index, lx/ly = label position
// Drawing area: x=0-500, y=90-490
const SHAPES = {

lion: () => [
  {el:`<rect x="0" y="90" width="500" height="195"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="405" width="500" height="85"/>`,n:5,lx:30,ly:450},
  {el:`<ellipse cx="250" cy="395" rx="88" ry="65"/>`,n:3,lx:250,ly:415},
  {el:`<circle cx="250" cy="278" r="112"/>`,n:2,lx:162,ly:230},
  {el:`<circle cx="250" cy="278" r="78"/>`,n:3,lx:250,ly:250},
  {el:`<polygon points="178,215 163,175 202,205"/>`,n:3,lx:181,ly:200},
  {el:`<polygon points="322,215 298,205 337,175"/>`,n:3,lx:319,ly:200},
  {el:`<ellipse cx="250" cy="316" rx="44" ry="30"/>`,n:13,lx:250,ly:318},
  {el:`<ellipse cx="250" cy="300" rx="14" ry="10"/>`,n:10,lx:250,ly:300},
  {el:`<circle cx="218" cy="265" r="14"/>`,n:10,lx:218,ly:265},
  {el:`<circle cx="282" cy="265" r="14"/>`,n:10,lx:282,ly:265},
  {el:`<ellipse cx="334" cy="362" rx="14" ry="42" transform="rotate(25,334,362)"/>`,n:2,lx:342,ly:350},
],

elephant: () => [
  {el:`<rect x="0" y="90" width="500" height="200"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="408" width="500" height="82"/>`,n:5,lx:30,ly:450},
  {el:`<ellipse cx="255" cy="368" rx="135" ry="100"/>`,n:12,lx:255,ly:395},
  {el:`<circle cx="205" cy="258" r="82"/>`,n:12,lx:205,ly:255},
  {el:`<ellipse cx="310" cy="292" rx="58" ry="88"/>`,n:12,lx:310,ly:292},
  {el:`<path d="M178,322 Q148,385 162,445 Q178,462 198,445 Q208,385 192,322"/>`,n:12,lx:186,ly:400},
  {el:`<circle cx="200" cy="242" r="15"/>`,n:11,lx:200,ly:242},
  {el:`<circle cx="200" cy="242" r="8"/>`,n:7,lx:200,ly:242},
  {el:`<ellipse cx="248" cy="235" rx="12" ry="8"/>`,n:9,lx:248,ly:235},
  {el:`<ellipse cx="330" cy="458" rx="22" ry="10"/>`,n:15,lx:330,ly:458},
  {el:`<ellipse cx="178" cy="458" rx="22" ry="10"/>`,n:15,lx:178,ly:458},
],

bird: () => [
  {el:`<rect x="0" y="90" width="500" height="210"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="390" width="500" height="100"/>`,n:4,lx:30,ly:445},
  {el:`<rect x="180" y="350" width="140" height="18" rx="5"/>`,n:10,lx:250,ly:359},
  {el:`<ellipse cx="250" cy="320" rx="70" ry="85"/>`,n:1,lx:250,ly:340},
  {el:`<circle cx="250" cy="242" r="52"/>`,n:2,lx:250,ly:240},
  {el:`<path d="M180,300 Q120,260 130,310 Q160,340 200,320"/>`,n:4,lx:145,ly:310},
  {el:`<path d="M320,300 Q380,260 370,310 Q340,340 300,320"/>`,n:5,lx:355,ly:310},
  {el:`<polygon points="250,258 230,280 270,280"/>`,n:3,lx:250,ly:272},
  {el:`<circle cx="238" cy="230" r="11"/>`,n:10,lx:238,ly:230},
  {el:`<circle cx="262" cy="230" r="11"/>`,n:10,lx:262,ly:230},
  {el:`<ellipse cx="250" cy="380" rx="25" ry="12"/>`,n:2,lx:250,ly:380},
],

zebra: () => [
  {el:`<rect x="0" y="90" width="500" height="195"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="405" width="500" height="85"/>`,n:5,lx:30,ly:450},
  {el:`<ellipse cx="255" cy="368" rx="130" ry="88"/>`,n:11,lx:140,ly:400},
  {el:`<ellipse cx="178" cy="258" rx="72" ry="88"/>`,n:11,lx:178,ly:248},
  {el:`<ellipse cx="148" cy="195" rx="22" ry="30"/>`,n:11,lx:148,ly:192},
  {el:`<ellipse cx="208" cy="195" rx="22" ry="30"/>`,n:11,lx:208,ly:192},
  {el:`<ellipse cx="178" cy="295" rx="32" ry="22"/>`,n:13,lx:178,ly:295},
  {el:`<rect x="100" y="340" width="50" height="78" rx="8"/>`,n:11,lx:125,ly:380},
  {el:`<rect x="165" y="340" width="50" height="78" rx="8"/>`,n:11,lx:190,ly:380},
  {el:`<rect x="300" y="360" width="50" height="78" rx="8"/>`,n:11,lx:325,ly:400},
  {el:`<rect x="365" y="360" width="50" height="78" rx="8"/>`,n:11,lx:390,ly:400},
  {el:`<ellipse cx="380" cy="338" rx="12" ry="38" transform="rotate(-15,380,338)"/>`,n:11,lx:385,ly:325},
  // stripes
  {el:`<ellipse cx="270" cy="355" rx="30" ry="60"/>`,n:10,lx:270,ly:355},
  {el:`<ellipse cx="178" cy="262" rx="18" ry="45"/>`,n:10,lx:178,ly:262},
  {el:`<circle cx="178" cy="240" r="9"/>`,n:10,lx:178,ly:240},
],

fish: () => [
  {el:`<rect x="0" y="90" width="500" height="320"/>`,n:6,lx:30,ly:115},
  {el:`<rect x="0" y="410" width="500" height="80"/>`,n:16,lx:30,ly:448},
  {el:`<ellipse cx="240" cy="275" rx="130" ry="75"/>`,n:2,lx:180,ly:275},
  {el:`<polygon points="370,220 420,260 370,300"/>`,n:1,lx:400,ly:260},
  {el:`<ellipse cx="290" cy="255" rx="42" ry="30"/>`,n:3,lx:290,ly:255},
  {el:`<ellipse cx="290" cy="290" rx="42" ry="25"/>`,n:9,lx:290,ly:290},
  {el:`<circle cx="190" cy="268" r="14"/>`,n:11,lx:190,ly:268},
  {el:`<circle cx="190" cy="268" r="7"/>`,n:10,lx:190,ly:268},
  {el:`<ellipse cx="130" cy="180" rx="28" ry="18"/>`,n:3,lx:130,ly:180},
  {el:`<ellipse cx="360" cy="380" rx="28" ry="18"/>`,n:4,lx:360,ly:380},
  {el:`<circle cx="420" cy="148" r="8"/>`,n:11,lx:420,ly:148},
  {el:`<circle cx="60" cy="340" r="6"/>`,n:11,lx:60,ly:340},
  {el:`<circle cx="88" cy="318" r="5"/>`,n:11,lx:88,ly:318},
],

trex: () => [
  {el:`<rect x="0" y="90" width="500" height="195"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="405" width="500" height="85"/>`,n:10,lx:30,ly:450},
  {el:`<ellipse cx="255" cy="355" rx="90" ry="110"/>`,n:4,lx:255,ly:385},
  {el:`<ellipse cx="285" cy="205" rx="68" ry="55"/>`,n:4,lx:285,ly:200},
  {el:`<polygon points="240,225 355,168 345,230"/>`,n:4,lx:310,ly:200},
  {el:`<path d="M353,168 Q390,148 405,172 Q415,195 385,210 Q355,225 345,210"/>`,n:3,lx:378,ly:185},
  {el:`<circle cx="368" cy="172" r="10"/>`,n:10,lx:368,ly:172},
  {el:`<circle cx="368" cy="172" r="5"/>`,n:11,lx:368,ly:172},
  {el:`<rect x="175" y="400" width="55" height="85" rx="10"/>`,n:5,lx:202,ly:445},
  {el:`<rect x="245" y="400" width="55" height="85" rx="10"/>`,n:5,lx:272,ly:445},
  {el:`<path d="M315,320 Q370,310 380,345 Q365,365 315,355"/>`,n:4,lx:348,ly:340},
  {el:`<polygon points="348,200 368,190 360,215"/>`,n:11,lx:358,ly:202},
],

stego: () => [
  {el:`<rect x="0" y="90" width="500" height="210"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:5,lx:30,ly:450},
  {el:`<ellipse cx="248" cy="368" rx="148" ry="88"/>`,n:4,lx:248,ly:390},
  {el:`<ellipse cx="148" cy="278" rx="68" ry="62"/>`,n:4,lx:148,ly:275},
  {el:`<ellipse cx="158" cy="318" rx="38" ry="22"/>`,n:13,lx:158,ly:318},
  // spikes along back
  {el:`<polygon points="200,285 215,195 228,285"/>`,n:1,lx:214,ly:240},
  {el:`<polygon points="240,268 258,170 274,268"/>`,n:1,lx:257,ly:215},
  {el:`<polygon points="280,265 298,175 312,265"/>`,n:1,lx:296,ly:218},
  {el:`<polygon points="318,272 334,188 348,272"/>`,n:1,lx:333,ly:225},
  {el:`<polygon points="352,285 365,208 378,285"/>`,n:1,lx:364,ly:240},
  {el:`<rect x="108" y="408" width="48" height="72" rx="10"/>`,n:5,lx:132,ly:445},
  {el:`<rect x="168" y="408" width="48" height="72" rx="10"/>`,n:5,lx:192,ly:445},
  {el:`<rect x="298" y="425" width="48" height="65" rx="10"/>`,n:5,lx:322,ly:460},
  {el:`<rect x="352" y="425" width="48" height="65" rx="10"/>`,n:5,lx:376,ly:460},
  {el:`<circle cx="138" cy="258" r="12"/>`,n:10,lx:138,ly:258},
],

car: () => [
  {el:`<rect x="0" y="90" width="500" height="150"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="370" width="500" height="120"/>`,n:12,lx:30,ly:435},
  {el:`<rect x="50" y="295" width="400" height="105" rx="18"/>`,n:1,lx:250,ly:345},
  {el:`<path d="M120,295 Q140,210 225,205 Q310,200 370,295"/>`,n:7,lx:250,ly:248},
  {el:`<rect x="145" y="215" width="95" height="72" rx="8"/>`,n:6,lx:192,ly:250},
  {el:`<rect x="255" y="215" width="95" height="72" rx="8"/>`,n:6,lx:302,ly:250},
  {el:`<circle cx="148" cy="390" r="48"/>`,n:10,lx:148,ly:390},
  {el:`<circle cx="148" cy="390" r="28"/>`,n:12,lx:148,ly:390},
  {el:`<circle cx="352" cy="390" r="48"/>`,n:10,lx:352,ly:390},
  {el:`<circle cx="352" cy="390" r="28"/>`,n:12,lx:352,ly:390},
  {el:`<rect x="50" y="330" width="28" height="18" rx="5"/>`,n:3,lx:64,ly:339},
  {el:`<rect x="422" y="330" width="28" height="18" rx="5"/>`,n:1,lx:436,ly:339},
  {el:`<rect x="55" y="285" width="38" height="14" rx="4"/>`,n:2,lx:74,ly:292},
],

firetruck: () => [
  {el:`<rect x="0" y="90" width="500" height="175"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="388" width="500" height="102"/>`,n:12,lx:30,ly:440},
  {el:`<rect x="30" y="280" width="440" height="130" rx="12"/>`,n:1,lx:250,ly:340},
  {el:`<rect x="30" y="205" width="148" height="90" rx="10"/>`,n:1,lx:104,ly:250},
  {el:`<rect x="48" y="215" width="112" height="68" rx="8"/>`,n:6,lx:104,ly:248},
  {el:`<rect x="195" y="258" width="265" height="45"/>`,n:11,lx:328,ly:280},
  {el:`<rect x="195" y="258" width="265" height="20"/>`,n:16,lx:328,ly:268},
  {el:`<circle cx="118" cy="398" r="45"/>`,n:10,lx:118,ly:398},
  {el:`<circle cx="118" cy="398" r="26"/>`,n:12,lx:118,ly:398},
  {el:`<circle cx="365" cy="398" r="45"/>`,n:10,lx:365,ly:398},
  {el:`<circle cx="365" cy="398" r="26"/>`,n:12,lx:365,ly:398},
  {el:`<rect x="195" y="195" width="30" height="55" rx="4"/>`,n:10,lx:210,ly:222},
  {el:`<rect x="28" y="198" width="30" height="10" rx="3"/>`,n:3,lx:43,ly:203},
],

airplane: () => [
  {el:`<rect x="0" y="90" width="500" height="310"/>`,n:14,lx:30,ly:115},
  {el:`<ellipse cx="250" cy="390" rx="230" ry="28"/>`,n:11,lx:30,ly:395},
  {el:`<ellipse cx="250" cy="285" rx="200" ry="45"/>`,n:11,lx:250,ly:285},
  {el:`<ellipse cx="250" cy="282" rx="195" ry="38"/>`,n:6,lx:250,ly:282},
  {el:`<ellipse cx="250" cy="280" rx="60" ry="35"/>`,n:11,lx:250,ly:280},
  {el:`<path d="M60,265 Q50,230 90,222 L220,265"/>`,n:6,lx:130,ly:240},
  {el:`<path d="M440,265 Q450,230 410,222 L280,265"/>`,n:6,lx:370,ly:240},
  {el:`<path d="M140,300 Q130,340 160,348 L220,305"/>`,n:7,lx:165,ly:330},
  {el:`<path d="M360,300 Q370,340 340,348 L280,305"/>`,n:7,lx:330,ly:330},
  {el:`<circle cx="188" cy="278" r="16"/>`,n:6,lx:188,ly:278},
  {el:`<circle cx="220" cy="278" r="16"/>`,n:6,lx:220,ly:278},
  {el:`<circle cx="280" cy="278" r="16"/>`,n:6,lx:280,ly:278},
  {el:`<ellipse cx="108" cy="283" rx="38" ry="18"/>`,n:12,lx:108,ly:283},
  {el:`<ellipse cx="392" cy="283" rx="38" ry="18"/>`,n:12,lx:392,ly:283},
],

train: () => [
  {el:`<rect x="0" y="90" width="500" height="180"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="395" width="500" height="95"/>`,n:10,lx:30,ly:445},
  {el:`<rect x="30" y="268" width="440" height="152" rx="16"/>`,n:1,lx:250,ly:340},
  {el:`<rect x="30" y="185" width="138" height="100" rx="14"/>`,n:7,lx:99,ly:235},
  {el:`<rect x="48" y="196" width="102" height="72" rx="10"/>`,n:6,lx:99,ly:232},
  {el:`<rect x="188" y="285" width="82" height="65" rx="8"/>`,n:6,lx:229,ly:317},
  {el:`<rect x="290" y="285" width="82" height="65" rx="8"/>`,n:6,lx:331,ly:317},
  {el:`<rect x="392" y="285" width="60" height="65" rx="8"/>`,n:6,lx:422,ly:317},
  {el:`<circle cx="98" cy="410" r="40"/>`,n:12,lx:98,ly:410},
  {el:`<circle cx="98" cy="410" r="22"/>`,n:11,lx:98,ly:410},
  {el:`<circle cx="245" cy="418" r="35"/>`,n:12,lx:245,ly:418},
  {el:`<circle cx="245" cy="418" r="20"/>`,n:11,lx:245,ly:418},
  {el:`<circle cx="388" cy="418" r="35"/>`,n:12,lx:388,ly:418},
  {el:`<circle cx="388" cy="418" r="20"/>`,n:11,lx:388,ly:418},
  {el:`<ellipse cx="72" cy="182" rx="28" ry="38"/>`,n:12,lx:72,ly:182},
],

rocket: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:7,lx:30,ly:115},
  {el:`<ellipse cx="250" cy="155" rx="62" ry="68"/>`,n:1,lx:250,ly:148},
  {el:`<rect x="188" y="195" width="124" height="195"/>`,n:11,lx:250,ly:290},
  {el:`<rect x="188" y="365" width="124" height="50"/>`,n:12,lx:250,ly:390},
  {el:`<polygon points="188,270 120,350 188,350"/>`,n:7,lx:148,ly:315},
  {el:`<polygon points="312,270 380,350 312,350"/>`,n:7,lx:352,ly:315},
  {el:`<circle cx="250" cy="278" r="38"/>`,n:6,lx:250,ly:278},
  {el:`<circle cx="250" cy="278" r="26"/>`,n:14,lx:250,ly:278},
  {el:`<rect x="215" y="414" width="32" height="65" rx="8"/>`,n:2,lx:231,ly:445},
  {el:`<rect x="253" y="414" width="32" height="65" rx="8"/>`,n:1,lx:269,ly:445},
  // stars
  {el:`<circle cx="60" cy="128" r="5"/>`,n:11,lx:60,ly:128},
  {el:`<circle cx="430" cy="155" r="5"/>`,n:11,lx:430,ly:155},
  {el:`<circle cx="80" cy="210" r="4"/>`,n:11,lx:80,ly:210},
  {el:`<circle cx="420" cy="240" r="4"/>`,n:11,lx:420,ly:240},
],

earth: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:10,lx:30,ly:115},
  {el:`<circle cx="250" cy="288" r="168"/>`,n:6,lx:108,ly:200},
  {el:`<ellipse cx="235" cy="255" rx="95" ry="68"/>`,n:4,lx:235,ly:252},
  {el:`<ellipse cx="290" cy="335" rx="68" ry="55"/>`,n:4,lx:290,ly:332},
  {el:`<ellipse cx="172" cy="325" rx="45" ry="38"/>`,n:4,lx:172,ly:322},
  {el:`<ellipse cx="348" cy="232" rx="42" ry="35"/>`,n:4,lx:348,ly:229},
  {el:`<ellipse cx="250" cy="168" rx="88" ry="24"/>`,n:11,lx:250,ly:168},
  {el:`<ellipse cx="160" cy="248" rx="55" ry="18"/>`,n:11,lx:160,ly:248},
  {el:`<circle cx="80" cy="150" r="6"/>`,n:11,lx:80,ly:150},
  {el:`<circle cx="415" cy="170" r="5"/>`,n:11,lx:415,ly:170},
  {el:`<circle cx="58" cy="330" r="5"/>`,n:11,lx:58,ly:330},
],

astronaut: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:10,lx:30,ly:115},
  {el:`<ellipse cx="250" cy="218" rx="82" ry="88"/>`,n:11,lx:250,ly:215},
  {el:`<ellipse cx="250" cy="222" rx="62" ry="68"/>`,n:6,lx:250,ly:218},
  {el:`<ellipse cx="250" cy="228" rx="45" ry="52"/>`,n:14,lx:250,ly:225},
  {el:`<rect x="188" y="295" width="124" height="130" rx="20"/>`,n:11,lx:250,ly:358},
  {el:`<rect x="228" y="295" width="44" height="50"/>`,n:12,lx:250,ly:320},
  {el:`<path d="M188,320 Q118,315 108,352 Q118,392 188,382"/>`,n:11,lx:138,ly:355},
  {el:`<path d="M312,320 Q382,315 392,352 Q382,392 312,382"/>`,n:11,lx:362,ly:355},
  {el:`<circle cx="118" cy="358" r="28"/>`,n:12,lx:118,ly:358},
  {el:`<circle cx="382" cy="358" r="28"/>`,n:12,lx:382,ly:358},
  {el:`<rect x="210" y="422" width="38" height="68" rx="12"/>`,n:11,lx:229,ly:458},
  {el:`<rect x="252" y="422" width="38" height="68" rx="12"/>`,n:11,lx:271,ly:458},
  {el:`<rect x="195" y="488" width="55" height="20" rx="8"/>`,n:12,lx:222,ly:497},
  {el:`<rect x="250" y="488" width="55" height="20" rx="8"/>`,n:12,lx:277,ly:497},
  {el:`<circle cx="80" cy="140" r="5"/>`,n:11,lx:80,ly:140},
  {el:`<circle cx="420" cy="160" r="5"/>`,n:11,lx:420,ly:160},
],

saturn: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:10,lx:30,ly:115},
  {el:`<ellipse cx="250" cy="288" rx="215" ry="22"/>`,n:13,lx:30,ly:288},
  {el:`<ellipse cx="250" cy="285" rx="188" ry="18"/>`,n:2,lx:65,ly:285},
  {el:`<circle cx="250" cy="288" r="112"/>`,n:3,lx:250,ly:255},
  {el:`<ellipse cx="250" cy="258" rx="75" ry="42"/>`,n:2,lx:250,ly:255},
  {el:`<ellipse cx="250" cy="318" rx="75" ry="42"/>`,n:2,lx:250,ly:320},
  {el:`<circle cx="72" cy="148" r="6"/>`,n:11,lx:72,ly:148},
  {el:`<circle cx="415" cy="165" r="5"/>`,n:11,lx:415,ly:165},
  {el:`<circle cx="58" cy="380" r="4"/>`,n:11,lx:58,ly:380},
  {el:`<circle cx="435" cy="395" r="4"/>`,n:11,lx:435,ly:395},
  {el:`<circle cx="120" cy="430" r="5"/>`,n:11,lx:120,ly:430},
],

hero: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:5,lx:30,ly:452},
  {el:`<path d="M225,388 Q188,342 180,290 L320,290 Q312,342 275,388"/>`,n:1,lx:250,ly:335},
  {el:`<circle cx="250" cy="238" r="58"/>`,n:13,lx:250,ly:235},
  {el:`<path d="M170,290 Q135,268 118,308 Q122,365 172,358"/>`,n:1,lx:142,ly:325},
  {el:`<path d="M330,290 Q365,268 382,308 Q378,365 328,358"/>`,n:1,lx:358,ly:325},
  {el:`<rect x="215" y="388" width="32" height="95" rx="10"/>`,n:7,lx:231,ly:435},
  {el:`<rect x="253" y="388" width="32" height="95" rx="10"/>`,n:7,lx:269,ly:435},
  {el:`<ellipse cx="215" cy="480" rx="30" ry="12"/>`,n:10,lx:215,ly:480},
  {el:`<ellipse cx="285" cy="480" rx="30" ry="12"/>`,n:10,lx:285,ly:480},
  {el:`<rect x="228" y="282" width="44" height="18" rx="4"/>`,n:3,lx:250,ly:291},
  {el:`<path d="M170,295 Q145,355 125,350 Q100,330 120,295"/>`,n:1,lx:135,ly:325},
],

robot: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:12,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:7,lx:30,ly:452},
  {el:`<rect x="168" y="140" width="164" height="118" rx="18"/>`,n:12,lx:250,ly:198},
  {el:`<rect x="185" y="155" width="60" height="42" rx="8"/>`,n:6,lx:215,ly:176},
  {el:`<rect x="255" y="155" width="60" height="42" rx="8"/>`,n:6,lx:285,ly:176},
  {el:`<rect x="205" y="210" width="90" height="22" rx="6"/>`,n:1,lx:250,ly:221},
  {el:`<rect x="115" y="256" width="270" height="135" rx="15"/>`,n:7,lx:250,ly:320},
  {el:`<rect x="148" y="278" width="75" height="88" rx="10"/>`,n:12,lx:185,ly:320},
  {el:`<rect x="277" y="278" width="75" height="88" rx="10"/>`,n:12,lx:314,ly:320},
  {el:`<rect x="68" y="268" width="52" height="115" rx="14"/>`,n:7,lx:94,ly:325},
  {el:`<rect x="380" y="268" width="52" height="115" rx="14"/>`,n:7,lx:406,ly:325},
  {el:`<rect x="188" y="390" width="50" height="95" rx="12"/>`,n:12,lx:213,ly:440},
  {el:`<rect x="262" y="390" width="50" height="95" rx="12"/>`,n:12,lx:287,ly:440},
  {el:`<rect x="168" y="125" width="164" height="20" rx="6"/>`,n:3,lx:250,ly:135},
  {el:`<rect x="240" y="100" width="20" height="28" rx="4"/>`,n:3,lx:250,ly:114},
],

unicorn: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:9,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:15,lx:30,ly:452},
  {el:`<ellipse cx="265" cy="368" rx="148" ry="88"/>`,n:11,lx:265,ly:398},
  {el:`<ellipse cx="162" cy="265" rx="82" ry="92"/>`,n:11,lx:162,ly:265},
  {el:`<path d="M100,220 Q115,155 148,165 Q162,168 148,210"/>`,n:9,lx:128,ly:185},
  {el:`<path d="M148,195 Q165,145 175,155 Q182,162 165,205"/>`,n:9,lx:162,ly:172},
  {el:`<polygon points="152,178 162,118 172,178"/>`,n:3,lx:162,ly:148},
  {el:`<ellipse cx="162" cy="308" rx="42" ry="28"/>`,n:13,lx:162,ly:308},
  {el:`<circle cx="148" cy="248" r="12"/>`,n:7,lx:148,ly:248},
  {el:`<rect x="108" y="408" width="50" height="82" rx="12"/>`,n:11,lx:133,ly:450},
  {el:`<rect x="168" y="408" width="50" height="82" rx="12"/>`,n:11,lx:193,ly:450},
  {el:`<rect x="308" y="420" width="50" height="70" rx="12"/>`,n:11,lx:333,ly:455},
  {el:`<rect x="368" y="420" width="50" height="70" rx="12"/>`,n:11,lx:393,ly:455},
  {el:`<ellipse cx="398" cy="348" rx="16" ry="52" transform="rotate(-20,398,348)"/>`,n:9,lx:408,ly:335},
],

dragon: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:1,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:10,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="358" rx="145" ry="108"/>`,n:4,lx:250,ly:385},
  {el:`<ellipse cx="175" cy="248" rx="72" ry="68"/>`,n:4,lx:175,ly:248},
  {el:`<path d="M330,230 Q398,168 418,195 Q428,225 378,258"/>`,n:4,lx:385,ly:218},
  {el:`<path d="M108,230 Q70,168 90,215 Q105,245 148,262"/>`,n:4,lx:96,ly:225},
  {el:`<polygon points="165,182 150,125 188,175"/>`,n:4,lx:166,ly:155},
  {el:`<polygon points="188,172 185,118 210,170"/>`,n:4,lx:192,ly:143},
  {el:`<ellipse cx="178" cy="288" rx="38" ry="25"/>`,n:3,lx:178,ly:288},
  {el:`<polygon points="178,288 155,322 202,322"/>`,n:1,lx:178,ly:312},
  {el:`<circle cx="162" cy="232" r="12"/>`,n:10,lx:162,ly:232},
  {el:`<rect x="118" y="418" width="55" height="72" rx="12"/>`,n:5,lx:145,ly:455},
  {el:`<rect x="188" y="418" width="55" height="72" rx="12"/>`,n:5,lx:215,ly:455},
  {el:`<ellipse cx="388" cy="358" rx="14" ry="55" transform="rotate(15,388,358)"/>`,n:4,lx:395,ly:345},
  {el:`<polygon points="385,408 400,460 370,460"/>`,n:1,lx:385,ly:442},
],

castle: () => [
  {el:`<rect x="0" y="90" width="500" height="195"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="405" width="500" height="85"/>`,n:4,lx:30,ly:452},
  {el:`<rect x="118" y="225" width="265" height="195"/>`,n:12,lx:250,ly:320},
  {el:`<rect x="45" y="255" width="95" height="165"/>`,n:12,lx:92,ly:340},
  {el:`<rect x="360" y="255" width="95" height="165"/>`,n:12,lx:407,ly:340},
  // battlements main tower
  {el:`<rect x="118" y="200" width="38" height="30"/>`,n:12,lx:137,ly:215},
  {el:`<rect x="175" y="200" width="38" height="30"/>`,n:12,lx:194,ly:215},
  {el:`<rect x="232" y="200" width="38" height="30"/>`,n:12,lx:251,ly:215},
  {el:`<rect x="289" y="200" width="38" height="30"/>`,n:12,lx:308,ly:215},
  {el:`<rect x="345" y="200" width="38" height="30"/>`,n:12,lx:364,ly:215},
  // battlements left tower
  {el:`<rect x="45" y="228" width="28" height="28"/>`,n:12,lx:59,ly:242},
  {el:`<rect x="85" y="228" width="28" height="28"/>`,n:12,lx:99,ly:242},
  // battlements right tower
  {el:`<rect x="362" y="228" width="28" height="28"/>`,n:12,lx:376,ly:242},
  {el:`<rect x="400" y="228" width="28" height="28"/>`,n:12,lx:414,ly:242},
  // door
  {el:`<path d="M210,418 L210,340 Q250,310 290,340 L290,418"/>`,n:10,lx:250,ly:380},
  // windows
  {el:`<rect x="148" y="278" width="52" height="52" rx="26"/>`,n:6,lx:174,ly:304},
  {el:`<rect x="300" y="278" width="52" height="52" rx="26"/>`,n:6,lx:326,ly:304},
  {el:`<rect x="62" y="288" width="42" height="42" rx="21"/>`,n:6,lx:83,ly:309},
  {el:`<rect x="396" y="288" width="42" height="42" rx="21"/>`,n:6,lx:417,ly:309},
  // flags
  {el:`<rect x="249" y="158" width="4" height="45"/>`,n:10,lx:251,ly:178},
  {el:`<polygon points="253,158 285,172 253,186"/>`,n:1,lx:268,ly:172},
],

person: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:5,lx:30,ly:452},
  {el:`<circle cx="250" cy="185" r="65"/>`,n:13,lx:250,ly:182},
  {el:`<rect x="185" y="248" width="130" height="28" rx="8"/>`,n:11,lx:250,ly:262},
  {el:`<rect x="172" y="272" width="156" height="118" rx="15"/>`,n:7,lx:250,ly:330},
  {el:`<rect x="245" y="345" width="32" height="22"/>`,n:11,lx:261,ly:356},
  {el:`<rect x="172" y="330" width="48" height="15"/>`,n:3,lx:196,ly:337},
  {el:`<rect x="308" y="330" width="48" height="15"/>`,n:3,lx:332,ly:337},
  {el:`<path d="M172,295 Q122,292 112,322 Q112,368 155,368 Q172,362 172,345"/>`,n:7,lx:132,ly:332},
  {el:`<path d="M328,295 Q378,292 388,322 Q388,368 345,368 Q328,362 328,345"/>`,n:7,lx:368,ly:332},
  {el:`<rect x="210" y="388" width="38" height="102" rx="12"/>`,n:10,lx:229,ly:440},
  {el:`<rect x="252" y="388" width="38" height="102" rx="12"/>`,n:10,lx:271,ly:440},
  {el:`<rect x="195" y="488" width="55" height="18" rx="8"/>`,n:10,lx:222,ly:497},
  {el:`<rect x="250" y="488" width="55" height="18" rx="8"/>`,n:10,lx:277,ly:497},
  {el:`<circle cx="235" cy="172" r="10"/>`,n:10,lx:235,ly:172},
  {el:`<circle cx="265" cy="172" r="10"/>`,n:10,lx:265,ly:172},
],

soccerball: () => [
  {el:`<rect x="0" y="90" width="500" height="215"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="425" width="500" height="65"/>`,n:4,lx:30,ly:458},
  {el:`<rect x="0" y="380" width="500" height="50"/>`,n:5,lx:30,ly:405},
  {el:`<circle cx="250" cy="298" r="152"/>`,n:11,lx:110,ly:225},
  {el:`<polygon points="250,168 222,220 250,255 278,220"/>`,n:10,lx:250,ly:210},
  {el:`<polygon points="138,225 148,278 198,280 228,248 210,200"/>`,n:10,lx:172,ly:248},
  {el:`<polygon points="362,225 352,278 302,280 272,248 290,200"/>`,n:10,lx:328,ly:248},
  {el:`<polygon points="108,338 138,388 198,378 212,328 160,295"/>`,n:10,lx:155,ly:345},
  {el:`<polygon points="250,408 222,370 250,345 278,370"/>`,n:10,lx:250,ly:372},
  {el:`<polygon points="392,338 362,388 302,378 288,328 340,295"/>`,n:10,lx:345,ly:345},
],

swimmer: () => [
  {el:`<rect x="0" y="90" width="500" height="145"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="235" width="500" height="255"/>`,n:6,lx:30,ly:360},
  {el:`<ellipse cx="250" cy="240" rx="245" ry="22"/>`,n:11,lx:30,ly:240},
  {el:`<circle cx="108" cy="215" r="52"/>`,n:13,lx:108,ly:212},
  {el:`<ellipse cx="108" cy="215" rx="42" ry="34"/>`,n:6,lx:108,ly:212},
  {el:`<rect x="148" y="228" width="178" height="75" rx="20"/>`,n:9,lx:237,ly:265},
  {el:`<path d="M322,248 Q378,238 415,258 Q435,282 405,302 Q375,312 330,295"/>`,n:13,lx:375,ly:273},
  {el:`<path d="M152,255 Q108,262 82,292 Q72,322 108,335 Q138,338 155,308"/>`,n:13,lx:108,ly:300},
  {el:`<ellipse cx="430" cy="265" rx="28" ry="18"/>`,n:13,lx:430,ly:265},
  {el:`<ellipse cx="68" cy="322" rx="28" ry="18"/>`,n:13,lx:68,ly:322},
  {el:`<path d="M85,200 Q108,168 130,200"/>`,n:3,lx:108,ly:182},
  {el:`<ellipse cx="108" cy="212" rx="28" ry="22"/>`,n:6,lx:108,ly:210},
],

pizza: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:13,lx:30,ly:115},
  {el:`<circle cx="250" cy="290" r="175"/>`,n:2,lx:250,ly:135},
  {el:`<circle cx="250" cy="290" r="148"/>`,n:3,lx:250,ly:152},
  {el:`<line x1="250" y1="142" x2="250" y2="438" stroke="#555" stroke-width="2"/>`,n:3,lx:260,ly:200},
  {el:`<line x1="96" y1="215" x2="404" y2="365" stroke="#555" stroke-width="2"/>`,n:3,lx:155,ly:250},
  {el:`<line x1="96" y1="365" x2="404" y2="215" stroke="#555" stroke-width="2"/>`,n:3,lx:155,ly:340},
  {el:`<circle cx="250" cy="210" r="18"/>`,n:1,lx:250,ly:210},
  {el:`<circle cx="195" cy="315" r="15"/>`,n:10,lx:195,ly:315},
  {el:`<circle cx="305" cy="315" r="15"/>`,n:10,lx:305,ly:315},
  {el:`<circle cx="250" cy="350" r="14"/>`,n:5,lx:250,ly:350},
  {el:`<circle cx="178" cy="248" r="13"/>`,n:1,lx:178,ly:248},
  {el:`<circle cx="322" cy="248" r="13"/>`,n:1,lx:322,ly:248},
  {el:`<circle cx="215" cy="258" r="10"/>`,n:5,lx:215,ly:258},
  {el:`<circle cx="285" cy="258" r="10"/>`,n:5,lx:285,ly:258},
],

cupcake: () => [
  {el:`<rect x="0" y="90" width="500" height="400"/>`,n:9,lx:30,ly:115},
  {el:`<path d="M148,355 Q165,488 335,488 Q352,355 148,355"/>`,n:3,lx:250,ly:428},
  {el:`<path d="M155,358 L178,358 L188,488 L162,488"/>`,n:2,lx:173,ly:425},
  {el:`<path d="M215,358 L238,358 L242,488 L218,488"/>`,n:2,lx:228,ly:425},
  {el:`<path d="M268,358 L291,358 L288,488 L264,488"/>`,n:2,lx:276,ly:425},
  {el:`<path d="M322,358 L345,358 L338,488 L314,488"/>`,n:2,lx:328,ly:425},
  {el:`<path d="M148,355 Q250,178 352,355"/>`,n:9,lx:250,ly:260},
  {el:`<path d="M165,355 Q250,205 335,355"/>`,n:16,lx:250,ly:285},
  {el:`<circle cx="250" cy="215" r="45"/>`,n:9,lx:250,ly:215},
  {el:`<circle cx="250" cy="178" r="15"/>`,n:1,lx:250,ly:178},
  // sprinkles
  {el:`<rect x="208" y="295" width="18" height="7" rx="3" transform="rotate(-30,208,295)"/>`,n:4,lx:208,ly:295},
  {el:`<rect x="268" y="308" width="18" height="7" rx="3" transform="rotate(20,268,308)"/>`,n:7,lx:268,ly:308},
  {el:`<rect x="235" y="320" width="16" height="6" rx="3" transform="rotate(-15,235,320)"/>`,n:5,lx:235,ly:320},
  {el:`<rect x="288" y="282" width="16" height="6" rx="3" transform="rotate(35,288,282)"/>`,n:1,lx:288,ly:282},
],

rainbow: () => [
  {el:`<rect x="0" y="90" width="500" height="310"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="400" width="500" height="90"/>`,n:4,lx:30,ly:452},
  {el:`<path d="M30,380 Q30,120 250,120 Q470,120 470,380"/>`,n:8,lx:250,ly:130},
  {el:`<path d="M58,380 Q58,148 250,148 Q442,148 442,380"/>`,n:7,lx:250,ly:158},
  {el:`<path d="M88,380 Q88,178 250,178 Q412,178 412,380"/>`,n:6,lx:250,ly:188},
  {el:`<path d="M118,380 Q118,208 250,208 Q382,208 382,380"/>`,n:4,lx:250,ly:218},
  {el:`<path d="M148,380 Q148,238 250,238 Q352,238 352,380"/>`,n:3,lx:250,ly:248},
  {el:`<path d="M178,380 Q178,268 250,268 Q322,268 322,380"/>`,n:2,lx:250,ly:278},
  {el:`<path d="M208,380 Q208,298 250,298 Q292,298 292,380"/>`,n:1,lx:250,ly:310},
  {el:`<ellipse cx="82" cy="365" rx="70" ry="48"/>`,n:11,lx:82,ly:365},
  {el:`<ellipse cx="418" cy="365" rx="70" ry="48"/>`,n:11,lx:418,ly:365},
  {el:`<ellipse cx="55" cy="348" rx="50" ry="35"/>`,n:11,lx:55,ly:348},
  {el:`<ellipse cx="445" cy="348" rx="50" ry="35"/>`,n:11,lx:445,ly:348},
],

flower: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:4,lx:30,ly:452},
  {el:`<rect x="242" y="298" width="16" height="132"/>`,n:5,lx:250,ly:360},
  {el:`<ellipse cx="220" cy="358" rx="38" ry="18" transform="rotate(-30,220,358)"/>`,n:4,lx:210,ly:358},
  {el:`<ellipse cx="280" cy="358" rx="38" ry="18" transform="rotate(30,280,358)"/>`,n:4,lx:290,ly:358},
  {el:`<circle cx="250" cy="255" r="62"/>`,n:3,lx:250,ly:255},
  {el:`<ellipse cx="250" cy="195" rx="30" ry="55"/>`,n:9,lx:250,ly:192},
  {el:`<ellipse cx="250" cy="315" rx="30" ry="55"/>`,n:9,lx:250,ly:318},
  {el:`<ellipse cx="190" cy="255" rx="55" ry="30"/>`,n:9,lx:188,ly:255},
  {el:`<ellipse cx="310" cy="255" rx="55" ry="30"/>`,n:9,lx:312,ly:255},
  {el:`<ellipse cx="208" cy="213" rx="30" ry="52" transform="rotate(-45,208,213)"/>`,n:1,lx:205,ly:210},
  {el:`<ellipse cx="292" cy="213" rx="30" ry="52" transform="rotate(45,292,213)"/>`,n:1,lx:295,ly:210},
  {el:`<ellipse cx="208" cy="297" rx="30" ry="52" transform="rotate(45,208,297)"/>`,n:1,lx:205,ly:300},
  {el:`<ellipse cx="292" cy="297" rx="30" ry="52" transform="rotate(-45,292,297)"/>`,n:1,lx:295,ly:300},
  {el:`<circle cx="250" cy="255" r="38"/>`,n:3,lx:250,ly:255},
],

xmastree: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:10,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:11,lx:30,ly:452},
  {el:`<rect x="218" y="415" width="64" height="65"/>`,n:10,lx:250,ly:452},
  {el:`<polygon points="250,108 145,255 355,255"/>`,n:5,lx:250,ly:210},
  {el:`<polygon points="250,178 118,348 382,348"/>`,n:4,lx:250,ly:300},
  {el:`<polygon points="250,258 95,435 405,435"/>`,n:5,lx:250,ly:390},
  {el:`<polygon points="250,95 237,115 263,115"/>`,n:3,lx:250,ly:104},
  // ornaments
  {el:`<circle cx="250" cy="208" r="14"/>`,n:1,lx:250,ly:208},
  {el:`<circle cx="195" cy="295" r="13"/>`,n:1,lx:195,ly:295},
  {el:`<circle cx="305" cy="295" r="13"/>`,n:2,lx:305,ly:295},
  {el:`<circle cx="168" cy="382" r="13"/>`,n:9,lx:168,ly:382},
  {el:`<circle cx="250" cy="388" r="13"/>`,n:2,lx:250,ly:388},
  {el:`<circle cx="332" cy="382" r="13"/>`,n:9,lx:332,ly:382},
  {el:`<circle cx="218" cy="345" r="11"/>`,n:3,lx:218,ly:345},
  {el:`<circle cx="282" cy="345" r="11"/>`,n:3,lx:282,ly:345},
],

pumpkin: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:10,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:5,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="328" rx="52" ry="148"/>`,n:2,lx:250,ly:328},
  {el:`<ellipse cx="168" cy="335" rx="52" ry="135"/>`,n:2,lx:168,ly:335},
  {el:`<ellipse cx="332" cy="335" rx="52" ry="135"/>`,n:2,lx:332,ly:335},
  {el:`<ellipse cx="108" cy="355" rx="42" ry="110"/>`,n:2,lx:108,ly:355},
  {el:`<ellipse cx="392" cy="355" rx="42" ry="110"/>`,n:2,lx:392,ly:355},
  {el:`<rect x="235" y="165" width="30" height="52" rx="10"/>`,n:5,lx:250,ly:188},
  // carved face
  {el:`<polygon points="195,290 215,258 235,290"/>`,n:3,lx:215,ly:278},
  {el:`<polygon points="265,290 285,258 305,290"/>`,n:3,lx:285,ly:278},
  {el:`<path d="M185,335 Q210,358 250,360 Q290,358 315,335 Q290,348 250,350 Q210,348 185,335"/>`,n:3,lx:250,ly:346},
],

puppy: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:4,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="355" rx="145" ry="105"/>`,n:10,lx:250,ly:385},
  {el:`<circle cx="250" cy="248" r="82"/>`,n:10,lx:250,ly:245},
  {el:`<ellipse cx="185" cy="208" rx="28" ry="48"/>`,n:10,lx:185,ly:205},
  {el:`<ellipse cx="315" cy="208" rx="28" ry="48"/>`,n:10,lx:315,ly:205},
  {el:`<ellipse cx="250" cy="288" rx="42" ry="30"/>`,n:9,lx:250,ly:290},
  {el:`<circle cx="250" cy="270" r="16"/>`,n:10,lx:250,ly:270},
  {el:`<circle cx="222" cy="238" r="14"/>`,n:10,lx:222,ly:238},
  {el:`<circle cx="278" cy="238" r="14"/>`,n:10,lx:278,ly:238},
  {el:`<ellipse cx="222" cy="238" rx="6" ry="8"/>`,n:7,lx:222,ly:238},
  {el:`<ellipse cx="278" cy="238" rx="6" ry="8"/>`,n:7,lx:278,ly:238},
  {el:`<rect x="148" y="418" width="50" height="72" rx="12"/>`,n:10,lx:173,ly:455},
  {el:`<rect x="208" y="418" width="50" height="72" rx="12"/>`,n:10,lx:233,ly:455},
  {el:`<rect x="268" y="418" width="50" height="72" rx="12"/>`,n:13,lx:293,ly:455},
  {el:`<rect x="328" y="418" width="50" height="72" rx="12"/>`,n:13,lx:353,ly:455},
  {el:`<ellipse cx="390" cy="340" rx="14" ry="38" transform="rotate(-15,390,340)"/>`,n:13,lx:398,ly:330},
],

cat: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:4,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="362" rx="135" ry="98"/>`,n:12,lx:250,ly:390},
  {el:`<circle cx="250" cy="248" r="78"/>`,n:12,lx:250,ly:245},
  {el:`<polygon points="185,192 165,148 210,185"/>`,n:12,lx:188,ly:172},
  {el:`<polygon points="315,192 290,185 335,148"/>`,n:12,lx:312,ly:172},
  {el:`<polygon points="188,193 172,158 208,188"/>`,n:9,lx:190,ly:172},
  {el:`<polygon points="312,193 292,188 328,158"/>`,n:9,lx:310,ly:172},
  {el:`<ellipse cx="250" cy="285" rx="35" ry="24"/>`,n:9,lx:250,ly:285},
  {el:`<circle cx="250" cy="270" r="13"/>`,n:9,lx:250,ly:270},
  {el:`<circle cx="222" cy="238" r="14"/>`,n:5,lx:222,ly:238},
  {el:`<circle cx="278" cy="238" r="14"/>`,n:5,lx:278,ly:238},
  {el:`<rect x="148" y="415" width="48" height="75" rx="12"/>`,n:12,lx:172,ly:455},
  {el:`<rect x="206" y="415" width="48" height="75" rx="12"/>`,n:12,lx:230,ly:455},
  {el:`<ellipse cx="390" cy="360" rx="14" ry="45" transform="rotate(-15,390,360)"/>`,n:9,lx:398,ly:348},
],

bunny: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:9,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:15,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="368" rx="118" ry="98"/>`,n:11,lx:250,ly:398},
  {el:`<circle cx="250" cy="258" r="72"/>`,n:11,lx:250,ly:255},
  {el:`<ellipse cx="215" cy="168" rx="22" ry="72"/>`,n:11,lx:215,ly:165},
  {el:`<ellipse cx="285" cy="168" rx="22" ry="72"/>`,n:11,lx:285,ly:165},
  {el:`<ellipse cx="215" cy="178" rx="12" ry="55"/>`,n:9,lx:215,ly:178},
  {el:`<ellipse cx="285" cy="178" rx="12" ry="55"/>`,n:9,lx:285,ly:178},
  {el:`<ellipse cx="250" cy="288" rx="30" ry="22"/>`,n:9,lx:250,ly:288},
  {el:`<circle cx="250" cy="272" r="12"/>`,n:9,lx:250,ly:272},
  {el:`<circle cx="228" cy="248" r="13"/>`,n:7,lx:228,ly:248},
  {el:`<circle cx="272" cy="248" r="13"/>`,n:7,lx:272,ly:248},
  {el:`<ellipse cx="318" cy="368" rx="32" ry="28"/>`,n:9,lx:318,ly:368},
  {el:`<rect x="178" y="415" width="48" height="75" rx="12"/>`,n:11,lx:202,ly:455},
  {el:`<rect x="275" y="415" width="48" height="75" rx="12"/>`,n:11,lx:299,ly:455},
],

butterfly: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:4,lx:30,ly:452},
  {el:`<rect x="243" y="155" width="14" height="248" rx="7"/>`,n:10,lx:250,ly:280},
  {el:`<ellipse cx="148" cy="248" rx="112" ry="88" transform="rotate(10,148,248)"/>`,n:1,lx:148,ly:245},
  {el:`<ellipse cx="352" cy="248" rx="112" ry="88" transform="rotate(-10,352,248)"/>`,n:2,lx:352,ly:245},
  {el:`<ellipse cx="148" cy="358" rx="75" ry="55" transform="rotate(-15,148,358)"/>`,n:9,lx:148,ly:358},
  {el:`<ellipse cx="352" cy="358" rx="75" ry="55" transform="rotate(15,352,358)"/>`,n:3,lx:352,ly:358},
  // wing spots
  {el:`<circle cx="138" cy="238" r="28"/>`,n:3,lx:138,ly:238},
  {el:`<circle cx="362" cy="238" r="28"/>`,n:3,lx:362,ly:238},
  {el:`<circle cx="148" cy="358" r="20"/>`,n:1,lx:148,ly:358},
  {el:`<circle cx="352" cy="358" r="20"/>`,n:1,lx:352,ly:358},
  // antennae
  {el:`<line x1="250" y1="155" x2="210" y2="118" stroke="#333" stroke-width="3"/>`,n:10,lx:225,ly:135},
  {el:`<circle cx="205" cy="112" r="7"/>`,n:10,lx:205,ly:112},
  {el:`<line x1="250" y1="155" x2="290" y2="118" stroke="#333" stroke-width="3"/>`,n:10,lx:275,ly:135},
  {el:`<circle cx="295" cy="112" r="7"/>`,n:10,lx:295,ly:112},
],

snowman: () => [
  {el:`<rect x="0" y="90" width="500" height="205"/>`,n:14,lx:30,ly:115},
  {el:`<rect x="0" y="415" width="500" height="75"/>`,n:11,lx:30,ly:452},
  {el:`<ellipse cx="250" cy="402" rx="118" ry="88"/>`,n:11,lx:250,ly:430},
  {el:`<circle cx="250" cy="298" r="72"/>`,n:11,lx:250,ly:295},
  {el:`<circle cx="250" cy="205" r="55"/>`,n:11,lx:250,ly:202},
  {el:`<rect x="210" y="148" width="80" height="52" rx="8"/>`,n:10,lx:250,ly:175},
  {el:`<rect x="195" y="148" width="110" height="15" rx="5"/>`,n:10,lx:250,ly:156},
  {el:`<ellipse cx="250" cy="233" rx="35" ry="18" transform="rotate(0,250,233)"/>`,n:2,lx:250,ly:233},
  {el:`<ellipse cx="230" cy="195" rx="8" ry="12"/>`,n:10,lx:230,ly:195},
  {el:`<ellipse cx="270" cy="195" rx="8" ry="12"/>`,n:10,lx:270,ly:195},
  {el:`<circle cx="238" cy="192" r="5"/>`,n:11,lx:238,ly:192},
  {el:`<circle cx="262" cy="192" r="5"/>`,n:11,lx:262,ly:192},
  {el:`<circle cx="250" cy="285" r="7"/>`,n:10,lx:250,ly:285},
  {el:`<circle cx="250" cy="308" r="7"/>`,n:10,lx:250,ly:308},
  {el:`<circle cx="250" cy="331" r="7"/>`,n:10,lx:250,ly:331},
  {el:`<path d="M178,295 Q148,278 125,295"/>`,n:10,lx:152,ly:285},
  {el:`<path d="M322,295 Q352,278 375,295"/>`,n:10,lx:348,ly:285},
],

};

// Map slugs to shape names
const PAGE_SHAPE = {
  // animals
  'lion-by-numbers-numbers':              'lion',
  'elephant-by-numbers-numbers':          'elephant',
  'parrot-by-numbers-numbers':            'bird',
  'zebra-by-numbers-numbers':             'zebra',
  'underwater-scene-by-numbers-numbers':  'fish',
  'safari-by-numbers-numbers':            'lion',
  // dinosaurs
  'baby-t-rex-by-numbers-numbers':        'trex',
  'dino-friends-by-numbers-numbers':      'stego',
  'stegosaurus-by-numbers-numbers':       'stego',
  'dino-volcano-by-numbers-numbers':      'trex',
  'dino-battle-by-numbers-numbers':       'trex',
  'jurassic-scene-by-numbers-numbers':    'stego',
  // vehicles
  'race-car-by-numbers-numbers':          'car',
  'fire-truck-by-numbers-numbers':        'firetruck',
  'airplane-by-numbers-numbers':          'airplane',
  'city-traffic-by-numbers-numbers':      'car',
  'train-by-numbers-numbers':             'train',
  'space-rocket-by-numbers-numbers':      'rocket',
  // space
  'planet-earth-by-numbers-numbers':      'earth',
  'rocket-by-numbers-numbers':            'rocket',
  'astronaut-by-numbers-numbers':         'astronaut',
  'saturn-by-numbers-numbers':            'saturn',
  'space-scene-by-numbers-numbers':       'earth',
  'galaxy-by-numbers-numbers':            'saturn',
  // superheroes
  'hero-by-numbers-numbers':              'hero',
  'superhero-city-by-numbers-numbers':    'castle',
  'hero-team-by-numbers-numbers':         'hero',
  'robot-hero-by-numbers-numbers':        'robot',
  'action-scene-by-numbers-numbers':      'hero',
  'hero-battle-by-numbers-numbers':       'robot',
  // fantasy
  'unicorn-by-numbers-numbers':           'unicorn',
  'princess-by-numbers-numbers':          'person',
  'dragon-by-numbers-numbers':            'dragon',
  'fairy-by-numbers-numbers':             'butterfly',
  'castle-by-numbers-numbers':            'castle',
  'magic-kingdom-by-numbers-numbers':     'castle',
  // jobs
  'firefighter-by-numbers-numbers':       'person',
  'doctor-by-numbers-numbers':            'person',
  'chef-by-numbers-numbers':              'person',
  'farmer-by-numbers-numbers':            'person',
  'scientist-by-numbers-numbers':         'person',
  'busy-city-by-numbers-numbers':         'castle',
  // sports
  'soccer-by-numbers-numbers':            'soccerball',
  'swimmer-by-numbers-numbers':           'swimmer',
  'cyclist-by-numbers-numbers':           'car',
  'gymnast-by-numbers-numbers':           'person',
  'sports-scene-by-numbers-numbers':      'soccerball',
  'olympic-games-by-numbers-numbers':     'hero',
  // food
  'fruit-bowl-by-numbers-numbers':        'pizza',
  'pizza-by-numbers-numbers':             'pizza',
  'cupcake-by-numbers-numbers':           'cupcake',
  'kitchen-by-numbers-numbers':           'cupcake',
  'smoothie-by-numbers-numbers':          'cupcake',
  'feast-by-numbers-numbers':             'pizza',
  // nature
  'rainbow-by-numbers-numbers':           'rainbow',
  'garden-by-numbers-numbers':            'flower',
  'seasons-by-numbers-numbers':           'xmastree',
  'forest-by-numbers-numbers':            'flower',
  'mountains-by-numbers-numbers':         'rainbow',
  'wild-nature-by-numbers-numbers':       'flower',
  // holidays
  'christmas-by-numbers-numbers':         'xmastree',
  'halloween-by-numbers-numbers':         'pumpkin',
  'easter-by-numbers-numbers':            'flower',
  'birthday-by-numbers-numbers':          'cupcake',
  'new-year-by-numbers-numbers':          'rainbow',
  'holiday-parade-by-numbers-numbers':    'snowman',
  // pets
  'puppy-by-numbers-numbers':             'puppy',
  'kitten-by-numbers-numbers':            'cat',
  'bunny-by-numbers-numbers':             'bunny',
  'bird-by-numbers-numbers':              'bird',
  'butterfly-by-numbers-numbers':         'butterfly',
  'pet-parade-by-numbers-numbers':        'puppy',
};

const CAT_COLORS = {
  animals:    '#4CAF50', dinosaurs: '#8BC34A', vehicles:  '#2196F3',
  space:      '#673AB7', superheroes:'#F44336', fantasy:  '#E91E63',
  jobs:       '#FF9800', sports:    '#00BCD4', food:      '#FF5722',
  nature:     '#009688', holidays:  '#9C27B0', pets:      '#795548',
};

function buildLegend(usedNums) {
  const nums = [...new Set(usedNums)].sort((a,b)=>a-b);
  const cols = Math.min(nums.length, 5);
  const rows = Math.ceil(nums.length / cols);
  const cw = Math.floor(490 / cols);
  const ch = 28;
  const startY = 502;
  let svg = '';
  nums.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 5 + col * cw;
    const y = startY + row * ch;
    const color = P[n];
    svg += `<rect x="${x}" y="${y}" width="22" height="22" rx="4" fill="${color.h}" stroke="#333" stroke-width="1.5"/>`;
    svg += `<text x="${x+11}" y="${y+14}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">${n}</text>`;
    svg += `<text x="${x+28}" y="${y+15}" font-size="11" fill="#333">${color.n}</text>`;
  });
  return { svg, rows };
}

function buildNumbersSVG(page) {
  const shapeFn = SHAPES[PAGE_SHAPE[page.slug]];
  if (!shapeFn) return null;
  const regions = shapeFn();
  const catColor = CAT_COLORS[page.category] || '#4CAF50';

  const usedNums = regions.map(r => r.n);
  const { svg: legendSvg, rows: legendRows } = buildLegend(usedNums);
  const totalH = 502 + legendRows * 28 + 12;

  let regionsSvg = '';
  regions.forEach(r => {
    // Draw the shape element with white fill and dark stroke
    regionsSvg += `<g fill="white" stroke="#333" stroke-width="2" stroke-linejoin="round">
      ${r.el}
    </g>`;
    // Draw number label circle
    regionsSvg += `<circle cx="${r.lx}" cy="${r.ly}" r="11" fill="${P[r.n].h}" stroke="#333" stroke-width="1.5"/>`;
    regionsSvg += `<text x="${r.lx}" y="${r.ly+4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#000">${r.n}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 ${totalH}">
  <defs>
    <style>text{font-family:Arial,sans-serif;}</style>
  </defs>
  <!-- header -->
  <rect x="0" y="0" width="500" height="88" fill="${catColor}"/>
  <text x="250" y="38" text-anchor="middle" font-size="20" font-weight="bold" fill="white">${page.title}</text>
  <text x="250" y="62" text-anchor="middle" font-size="13" fill="rgba(255,255,255,0.9)">${page.category.charAt(0).toUpperCase()+page.category.slice(1)} · ${page.difficulty.charAt(0).toUpperCase()+page.difficulty.slice(1)} · ${page.age} años</text>
  <text x="250" y="80" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.7)">Colorear por Números · chartkids.com</text>
  <!-- drawing -->
  ${regionsSvg}
  <!-- legend border -->
  <rect x="5" y="497" width="490" height="${legendRows*28+8}" rx="6" fill="#f9f9f9" stroke="#ddd" stroke-width="1.5"/>
  <text x="15" y="494" font-size="11" font-weight="bold" fill="#555">CLAVE DE COLORES:</text>
  ${legendSvg}
</svg>`;
}

function buildPage(page, svgContent) {
  const catColor = CAT_COLORS[page.category] || '#4CAF50';
  const diffLabel = {easy:'Fácil',medium:'Medio',hard:'Difícil'}[page.difficulty]||page.difficulty;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title} - Colorear por Números | ChartKids</title>
<meta name="description" content="Colorea ${page.title} por números. Actividad imprimible para niños de ${page.age} años. Nivel ${diffLabel}.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#f5f5f5;color:#333}
header{background:${catColor};color:white;padding:12px 20px;display:flex;align-items:center;gap:12px}
header h1{font-size:18px}
.back{color:white;text-decoration:none;font-size:13px;opacity:.85}
.back:hover{opacity:1}
.container{max-width:580px;margin:20px auto;padding:0 16px}
.print-btn{display:block;width:100%;padding:12px;background:${catColor};color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;margin-bottom:16px}
.print-btn:hover{filter:brightness(1.1)}
.activity-card{background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.activity-card svg{width:100%;height:auto;display:block}
.meta{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.tag{background:#f0f0f0;border-radius:20px;padding:4px 12px;font-size:12px}
.instructions{background:#fffbf0;border:1px solid #ffe0a0;border-radius:8px;padding:12px;margin-top:12px;font-size:13px}
@media print{
  header,.print-btn,.meta,.instructions{display:none!important}
  body{background:white}
  .container{max-width:100%;margin:0;padding:0}
  .activity-card{box-shadow:none;padding:0}
}
</style>
</head>
<body>
<header>
  <a class="back" href="/numbers/">← Colorear por Números</a>
  <h1>${page.title}</h1>
</header>
<div class="container">
  <button class="print-btn" onclick="window.print()">Imprimir</button>
  <div class="activity-card">
    ${svgContent}
  </div>
  <div class="meta">
    <span class="tag">Edad: ${page.age} años</span>
    <span class="tag">Nivel: ${diffLabel}</span>
    <span class="tag">${page.category.charAt(0).toUpperCase()+page.category.slice(1)}</span>
  </div>
  <div class="instructions">
    <strong>Instrucciones:</strong> Mira la clave de colores al pie de la imagen. Colorea cada sección con el color que corresponde al número indicado.
  </div>
</div>
</body>
</html>`;
}

// Build all pages
let built = 0, skipped = 0;
const sitemapLines = [];

for (const page of pages) {
  const dir = path.join('numbers', page.slug);
  const htmlPath = path.join(dir, 'index.html');
  if (fs.existsSync(htmlPath)) { skipped++; continue; }

  const svgContent = buildNumbersSVG(page);
  if (!svgContent) {
    console.warn(`  WARN no shape for [${page.id}] ${page.slug}`);
    skipped++;
    continue;
  }

  fs.mkdirSync(dir, { recursive: true });
  const html = buildPage(page, svgContent);
  fs.writeFileSync(htmlPath, html);
  console.log(`  build [${page.id}] ${page.title}`);
  built++;
  sitemapLines.push(`  <url><loc>https://chartkids.com/numbers/${page.slug}/</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
}

// Update sitemap
if (sitemapLines.length > 0) {
  const sm = fs.readFileSync('sitemap.xml','utf8');
  const updated = sm.replace('</urlset>', sitemapLines.join('\n') + '\n</urlset>');
  fs.writeFileSync('sitemap.xml', updated);
  console.log(`✓ sitemap +${sitemapLines.length} URLs`);
}

console.log(`\n✓ Built: ${built}  Skipped: ${skipped}`);
