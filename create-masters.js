// create-masters.js — Generates master JSON files for mazes, dots, color-by-numbers
const fs = require('fs');

const mazeTopics = {
  animals:    [['Lion Maze','3-6','easy'],['Elephant Maze','4-7','easy'],['Jungle Maze','4-7','medium'],['Safari Maze','5-8','medium'],['Ocean Animals Maze','6-9','hard'],['Arctic Animals Maze','6-9','hard']],
  dinosaurs:  [['Baby Dino Maze','3-6','easy'],['Jurassic Maze','4-7','medium'],['Volcano Maze','5-8','medium'],['Prehistoric Maze','6-9','hard'],['Dino Egg Hunt Maze','5-8','medium'],['T-Rex Escape Maze','7-10','hard']],
  vehicles:   [['Car Park Maze','3-6','easy'],['City Traffic Maze','4-7','easy'],['Race Track Maze','5-8','medium'],['Airport Maze','5-8','medium'],['Train Tracks Maze','6-9','hard'],['Space Launch Maze','7-10','hard']],
  space:      [['Rocket Maze','4-7','easy'],['Planet Hop Maze','5-8','medium'],['Astronaut Maze','5-8','medium'],['Galaxy Maze','6-9','hard'],['Star Map Maze','6-9','hard'],['Black Hole Maze','7-10','hard']],
  superheroes:[['Hero Training Maze','4-7','easy'],['City Rescue Maze','5-8','medium'],['Superpower Maze','5-8','medium'],['Villain Maze','6-9','hard'],['Hero HQ Maze','6-9','hard'],['Final Battle Maze','7-10','hard']],
  fantasy:    [['Castle Maze','4-7','easy'],['Dragon Cave Maze','5-8','medium'],['Enchanted Forest Maze','5-8','medium'],['Magic Tower Maze','6-9','hard'],['Unicorn Garden Maze','4-7','easy'],['Wizard Maze','7-10','hard']],
  jobs:       [['Fire Station Maze','3-6','easy'],['Hospital Maze','4-7','easy'],['City Jobs Maze','5-8','medium'],['Construction Maze','5-8','medium'],['Farm Maze','4-7','easy'],['Big City Maze','6-9','hard']],
  sports:     [['Soccer Field Maze','4-7','easy'],['Sports Arena Maze','5-8','medium'],['Olympic Maze','5-8','medium'],['Stadium Maze','6-9','hard'],['Gym Maze','4-7','easy'],['Championship Maze','7-10','hard']],
  food:       [['Pizza Delivery Maze','3-6','easy'],['Fruit Garden Maze','3-6','easy'],['Kitchen Maze','4-7','medium'],['Restaurant Maze','5-8','medium'],['Bakery Maze','4-7','easy'],['Food Market Maze','6-9','hard']],
  nature:     [['Garden Maze','3-6','easy'],['Forest Path Maze','4-7','easy'],['Mountain Trail Maze','5-8','medium'],['Jungle Path Maze','5-8','medium'],['River Maze','6-9','hard'],['Volcano Path Maze','7-10','hard']],
  holidays:   [['Christmas Tree Maze','3-6','easy'],['Halloween Maze','4-7','easy'],['Easter Egg Hunt Maze','4-7','easy'],['Holiday Party Maze','5-8','medium'],['Winter Maze','5-8','medium'],['Festival Maze','6-9','hard']],
  pets:       [['Puppy Maze','3-6','easy'],['Kitten Maze','3-6','easy'],['Pet Park Maze','4-7','easy'],['Bug Garden Maze','4-7','medium'],['Pet Show Maze','5-8','medium'],['Butterfly Maze','5-8','medium']],
};

const dotsTopics = {
  animals:    [['Connect the Lion','3-6','easy'],['Connect the Elephant','3-6','easy'],['Connect the Dolphin','4-7','medium'],['Connect the Tiger','5-8','medium'],['Connect the Eagle','5-8','medium'],['Connect the Whale','6-9','hard']],
  dinosaurs:  [['Connect the T-Rex','4-7','easy'],['Connect the Triceratops','4-7','easy'],['Connect the Pterodactyl','5-8','medium'],['Connect the Stegosaurus','5-8','medium'],['Connect the Brachiosaurus','6-9','hard'],['Connect the Dino Herd','7-10','hard']],
  vehicles:   [['Connect the Car','3-6','easy'],['Connect the Fire Truck','3-6','easy'],['Connect the Airplane','4-7','medium'],['Connect the Rocket','4-7','medium'],['Connect the Train','5-8','medium'],['Connect the Spaceship','6-9','hard']],
  space:      [['Connect the Rocket','3-6','easy'],['Connect the Planet','4-7','easy'],['Connect the Astronaut','4-7','medium'],['Connect the Alien','5-8','medium'],['Connect the UFO','5-8','medium'],['Connect the Galaxy','6-9','hard']],
  superheroes:[['Connect the Hero','4-7','easy'],['Connect the Cape','4-7','easy'],['Connect the Superhero','5-8','medium'],['Connect the Robot','5-8','medium'],['Connect the Team','6-9','hard'],['Connect the Battle','7-10','hard']],
  fantasy:    [['Connect the Unicorn','3-6','easy'],['Connect the Princess','4-7','easy'],['Connect the Dragon','4-7','medium'],['Connect the Castle','5-8','medium'],['Connect the Fairy','5-8','medium'],['Connect the Mermaid','6-9','hard']],
  jobs:       [['Connect the Firefighter','3-6','easy'],['Connect the Doctor','3-6','easy'],['Connect the Chef','4-7','medium'],['Connect the Pilot','4-7','medium'],['Connect the Scientist','5-8','medium'],['Connect the Builder','6-9','hard']],
  sports:     [['Connect the Soccer Ball','3-6','easy'],['Connect the Bicycle','4-7','easy'],['Connect the Swimmer','4-7','medium'],['Connect the Gymnast','5-8','medium'],['Connect the Runner','5-8','medium'],['Connect the Skater','6-9','hard']],
  food:       [['Connect the Pizza','3-6','easy'],['Connect the Apple','3-6','easy'],['Connect the Cake','4-7','easy'],['Connect the Ice Cream','4-7','medium'],['Connect the Sandwich','5-8','medium'],['Connect the Feast','6-9','hard']],
  nature:     [['Connect the Sun','3-6','easy'],['Connect the Rainbow','3-6','easy'],['Connect the Flower','4-7','easy'],['Connect the Tree','4-7','medium'],['Connect the Butterfly','5-8','medium'],['Connect the Mountain','6-9','hard']],
  holidays:   [['Connect the Christmas Tree','3-6','easy'],['Connect the Pumpkin','3-6','easy'],['Connect the Santa','4-7','easy'],['Connect the Snowman','4-7','medium'],['Connect the Easter Egg','5-8','medium'],['Connect the Fireworks','6-9','hard']],
  pets:       [['Connect the Puppy','3-6','easy'],['Connect the Kitten','3-6','easy'],['Connect the Rabbit','4-7','easy'],['Connect the Parrot','4-7','medium'],['Connect the Butterfly','5-8','medium'],['Connect the Fish Bowl','5-8','medium']],
};

const numbersTopics = {
  animals:    [['Lion by Numbers','3-6','easy'],['Elephant by Numbers','3-6','easy'],['Parrot by Numbers','4-7','medium'],['Zebra by Numbers','5-8','medium'],['Underwater Scene by Numbers','5-8','medium'],['Safari by Numbers','6-9','hard']],
  dinosaurs:  [['Baby T-Rex by Numbers','4-7','easy'],['Dino Friends by Numbers','4-7','easy'],['Stegosaurus by Numbers','5-8','medium'],['Dino Volcano by Numbers','5-8','medium'],['Dino Battle by Numbers','6-9','hard'],['Jurassic Scene by Numbers','7-10','hard']],
  vehicles:   [['Race Car by Numbers','3-6','easy'],['Fire Truck by Numbers','3-6','easy'],['Airplane by Numbers','4-7','medium'],['City Traffic by Numbers','5-8','medium'],['Train by Numbers','4-7','easy'],['Space Rocket by Numbers','6-9','hard']],
  space:      [['Planet Earth by Numbers','3-6','easy'],['Rocket by Numbers','4-7','easy'],['Astronaut by Numbers','4-7','medium'],['Saturn by Numbers','5-8','medium'],['Space Scene by Numbers','6-9','hard'],['Galaxy by Numbers','7-10','hard']],
  superheroes:[['Hero by Numbers','4-7','easy'],['Superhero City by Numbers','5-8','medium'],['Hero Team by Numbers','5-8','medium'],['Robot Hero by Numbers','6-9','hard'],['Action Scene by Numbers','6-9','hard'],['Hero Battle by Numbers','7-10','hard']],
  fantasy:    [['Unicorn by Numbers','3-6','easy'],['Princess by Numbers','4-7','easy'],['Dragon by Numbers','4-7','medium'],['Fairy by Numbers','5-8','medium'],['Castle by Numbers','6-9','hard'],['Magic Kingdom by Numbers','7-10','hard']],
  jobs:       [['Firefighter by Numbers','3-6','easy'],['Doctor by Numbers','4-7','easy'],['Chef by Numbers','4-7','medium'],['Farmer by Numbers','4-7','easy'],['Scientist by Numbers','5-8','medium'],['Busy City by Numbers','6-9','hard']],
  sports:     [['Soccer by Numbers','3-6','easy'],['Swimmer by Numbers','4-7','easy'],['Cyclist by Numbers','4-7','medium'],['Gymnast by Numbers','5-8','medium'],['Sports Scene by Numbers','5-8','medium'],['Olympic Games by Numbers','6-9','hard']],
  food:       [['Fruit Bowl by Numbers','3-6','easy'],['Pizza by Numbers','3-6','easy'],['Cupcake by Numbers','3-6','easy'],['Kitchen by Numbers','4-7','medium'],['Smoothie by Numbers','4-7','easy'],['Feast by Numbers','6-9','hard']],
  nature:     [['Rainbow by Numbers','3-6','easy'],['Garden by Numbers','3-6','easy'],['Seasons by Numbers','4-7','medium'],['Forest by Numbers','5-8','medium'],['Mountains by Numbers','5-8','medium'],['Wild Nature by Numbers','6-9','hard']],
  holidays:   [['Christmas by Numbers','3-6','easy'],['Halloween by Numbers','3-6','easy'],['Easter by Numbers','4-7','easy'],['Birthday by Numbers','4-7','medium'],['New Year by Numbers','5-8','medium'],['Holiday Parade by Numbers','6-9','hard']],
  pets:       [['Puppy by Numbers','3-6','easy'],['Kitten by Numbers','3-6','easy'],['Bunny by Numbers','3-6','easy'],['Bird by Numbers','4-7','medium'],['Butterfly by Numbers','4-7','medium'],['Pet Parade by Numbers','6-9','hard']],
};

function buildJSON(topics, suffix) {
  let id = 1, pages = [];
  for (const [cat, list] of Object.entries(topics)) {
    for (const [title, age, diff] of list) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '-' + suffix;
      pages.push({ id, category: cat, title, age, difficulty: diff, slug });
      id++;
    }
  }
  return pages;
}

const mazes   = buildJSON(mazeTopics,    'maze');
const dots    = buildJSON(dotsTopics,    'dots');
const numbers = buildJSON(numbersTopics, 'numbers');

fs.writeFileSync('master-mazes-72.json',   JSON.stringify(mazes,   null, 2));
fs.writeFileSync('master-dots-72.json',    JSON.stringify(dots,    null, 2));
fs.writeFileSync('master-numbers-72.json', JSON.stringify(numbers, null, 2));

console.log('Mazes:   ', mazes.length);
console.log('Dots:    ', dots.length);
console.log('Numbers: ', numbers.length);
console.log('Total:   ', mazes.length + dots.length + numbers.length, 'new activity pages');
