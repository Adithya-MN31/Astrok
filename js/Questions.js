/* questions.js - question banks for the Games page. Add or edit entries to grow the games.
   Level 1 = Cadet (easy), Level 2 = Pilot (medium), Level 3 = Commander (hard).

   QUIZ_BANK  : [question, [4 options], index of the right option (0-3), explanation]
   FACT_BANK  : [statement, true or false, explanation]
   WORD_BANK  : { w: WORD IN CAPITALS, h: clue, e: picture emoji }                                  */

const _q = a => ({ q: a[0], options: a[1], answer: a[2], why: a[3] });

const QUIZ_BANK = {
  /* ---------- Level 1: easy (also mixed with the mission questions) ---------- */
  1: [
    ['Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Earth', 'Mars'], 1, 'Mercury is the closest planet to the Sun.'],
    ['What do we call a person who travels into space?', ['An astronaut', 'A detective', 'A farmer', 'A sailor'], 0, 'Astronauts train for years to live and work in space.'],
    ['What is the name of our galaxy?', ['Andromeda', 'The Milky Way', 'The Sombrero', 'The Whirlpool'], 1, 'Our Solar System is inside the Milky Way galaxy.'],
    ['What is at the center of our solar system?', ['The Moon', 'Mars', 'The Sun', 'A black hole'], 2, 'The Sun is a star, and all the planets circle around it.'],
    ['Which planet do we live on?', ['Mars', 'Venus', 'Jupiter', 'Earth'], 3, 'Earth is the third planet from the Sun.'],
    ['What is the Moon?', ['A star', 'A planet', 'A comet', 'Earth\'s natural satellite'], 3, 'The Moon circles Earth, so it is a natural satellite.'],
    ['Which planet is called the Red Planet?', ['Mars', 'Saturn', 'Neptune', 'Mercury'], 0, 'Rusty iron dust makes Mars look red.'],
    ['What do astronauts wear when they work outside the station?', ['Pajamas', 'A spacesuit', 'A swimsuit', 'A raincoat'], 1, 'A spacesuit gives air, warmth and protection.'],
    ['Which is the biggest planet in our solar system?', ['Earth', 'Saturn', 'Jupiter', 'Mars'], 2, 'More than 1,000 Earths could fit inside Jupiter.'],
    ['What force pulls things toward the ground?', ['Magnetism', 'Gravity', 'Wind', 'Light'], 1, 'Gravity pulls objects toward the center of a planet.'],
    ['What do we call a ball of ice and dust with a glowing tail?', ['A comet', 'A moon', 'A planet', 'A satellite'], 0, 'Near the Sun, a comet\'s ice turns to gas and forms a tail.'],
    ['How many planets are in our solar system?', ['Six', 'Seven', 'Eight', 'Ten'], 2, 'There are eight planets, from Mercury to Neptune.'],
    ['Which planet has bright rings that are easy to see?', ['Mars', 'Saturn', 'Mercury', 'Venus'], 1, 'Saturn\'s rings are made of ice and rock.'],
    ['What does a rocket need to lift off?', ['Strong engines and fuel', 'A big sail', 'Pedals', 'A long rope'], 0, 'Burning fuel makes the push that lifts a rocket.'],
    ['Who was the first person to walk on the Moon?', ['Yuri Gagarin', 'Buzz Lightyear', 'Neil Armstrong', 'Alan Shepard'], 2, 'Neil Armstrong stepped onto the Moon in 1969.'],
    ['Why does the Moon shine at night?', ['It makes its own light', 'It reflects sunlight', 'It is on fire', 'Earth lights it with lamps'], 1, 'The Moon only reflects light from the Sun.'],
    ['What do we call the path a planet takes around the Sun?', ['A track', 'A tunnel', 'An orbit', 'A river'], 2, 'An orbit is the curved path around a star or planet.'],
    ['What is the Sun?', ['A planet', 'A star', 'A moon', 'A comet'], 1, 'The Sun is a star: a huge ball of hot glowing gas.'],
    ['Which of these is NOT a planet?', ['Venus', 'The Sun', 'Neptune', 'Mars'], 1, 'The Sun is a star, not a planet.'],
    ['Where do astronauts live and work in orbit?', ['A lighthouse', 'A space station', 'A rocket garage', 'A beach house'], 1, 'The International Space Station is a home and lab in space.']
  ].map(_q),

  /* ---------- Level 2: medium ---------- */
  2: [
    ['About how long does sunlight take to reach Earth?', ['8 seconds', '8 minutes', '8 hours', '8 days'], 1, 'Light travels very fast, but the Sun is far: about 8 minutes.'],
    ['Which planet spins on its side?', ['Uranus', 'Mars', 'Jupiter', 'Mercury'], 0, 'Uranus is tipped over, so it rolls around the Sun like a ball.'],
    ['What is the biggest moon of Saturn?', ['Europa', 'Titan', 'Io', 'Triton'], 1, 'Titan is bigger than the planet Mercury.'],
    ['Which planet is the hottest?', ['Mercury', 'Mars', 'Venus', 'Jupiter'], 2, 'Venus\'s thick air traps heat, so it is hotter than Mercury.'],
    ['What is a light-year?', ['A year with extra light', 'A very fast spaceship', 'A time to build a rocket', 'A distance light travels in one year'], 3, 'A light-year measures distance, not time.'],
    ['Which space telescope has orbited Earth since 1990?', ['Hubble', 'Voyager', 'Kepler', 'Apollo'], 0, 'The Hubble Space Telescope has taken famous pictures of deep space.'],
    ['The asteroid belt lies between which two planets?', ['Earth and Mars', 'Mars and Jupiter', 'Jupiter and Saturn', 'Venus and Earth'], 1, 'Millions of space rocks circle between Mars and Jupiter.'],
    ['Which planet spins fastest, with a day about 10 hours long?', ['Earth', 'Venus', 'Jupiter', 'Mercury'], 2, 'Jupiter is huge but spins very fast.'],
    ['What causes the phases of the Moon?', ['Earth\'s shadow every night', 'Clouds covering it', 'The Moon changing size', 'We see different amounts of its sunlit side'], 3, 'As the Moon orbits Earth, we see more or less of its lit half.'],
    ['Which NASA rover landed on Mars in 2021?', ['Curiosity', 'Perseverance', 'Opportunity', 'Spirit'], 1, 'Perseverance landed in Jezero Crater in February 2021.'],
    ['Which gas makes up most of the Sun?', ['Oxygen', 'Hydrogen', 'Helium only', 'Carbon dioxide'], 1, 'The Sun is mostly hydrogen, which it turns into helium.'],
    ['What is Olympus Mons?', ['A giant volcano on Mars', 'A crater on the Moon', 'A moon of Jupiter', 'A star'], 0, 'It is the tallest volcano in the solar system.'],
    ['What do we call a space rock that burns up in Earth\'s air?', ['A comet', 'A planet', 'A meteor', 'A satellite'], 2, 'The bright streak is a meteor, often called a shooting star.'],
    ['Which planet is farthest from the Sun?', ['Uranus', 'Neptune', 'Saturn', 'Pluto'], 1, 'Neptune is the eighth and farthest planet.'],
    ['How does the space station make its electricity?', ['Wind turbines', 'A coal engine', 'Solar panels', 'Batteries only'], 2, 'Big solar panels turn sunlight into power.'],
    ['About how many days does the Moon take to go once around Earth?', ['3 days', '27 days', '90 days', '365 days'], 1, 'The Moon circles Earth in about 27 days.'],
    ['What keeps the planets orbiting the Sun?', ['Wind', 'Gravity', 'Magnets', 'Strings'], 1, 'The Sun\'s gravity keeps planets in their orbits.'],
    ['Which blue planet has the fastest winds in the solar system?', ['Uranus', 'Earth', 'Neptune', 'Venus'], 2, 'Neptune\'s winds can race faster than the speed of sound on Earth.'],
    ['What was the first artificial satellite, launched in 1957?', ['Apollo 1', 'Sputnik 1', 'Explorer', 'Hubble'], 1, 'The Soviet satellite Sputnik 1 began the Space Age.'],
    ['Which of these is a dwarf planet?', ['Titan', 'Io', 'Pluto', 'Europa'], 2, 'Pluto and Ceres are dwarf planets. The others are moons.']
  ].map(_q),

  /* ---------- Level 3: hard ---------- */
  3: [
    ['About how fast must a rocket go to escape Earth\'s gravity?', ['1 km per second', '11 km per second', '110 km per second', '1,100 km per second'], 1, 'Escape speed from Earth is about 11 kilometers per second.'],
    ['The edge of space (the Karman line) is about how high?', ['10 km', '50 km', '100 km', '1,000 km'], 2, 'Space is usually said to begin at 100 kilometers above sea level.'],
    ['Which moon of Jupiter may hide a deep ocean under its ice?', ['Europa', 'Io', 'Phobos', 'Triton'], 0, 'Scientists want to search Europa\'s ocean for signs of life.'],
    ['About how old is the universe?', ['4.6 million years', '13.8 million years', '4.6 billion years', '13.8 billion years'], 3, 'The universe is about 13.8 billion years old.'],
    ['Which star is closest to our Sun?', ['Sirius', 'Proxima Centauri', 'Polaris', 'Betelgeuse'], 1, 'Proxima Centauri is about 4.2 light-years away.'],
    ['What is a black hole?', ['A hole in a planet', 'A very dark cloud', 'A place where gravity is so strong not even light escapes', 'A star that has gone out'], 2, 'A black hole\'s gravity is strong enough to trap light.'],
    ['Which spacecraft first entered interstellar space, in 2012?', ['Voyager 1', 'Apollo 11', 'Hubble', 'Pioneer 3'], 0, 'Voyager 1 left the Sun\'s bubble of particles in 2012.'],
    ['Which telescope launched in 2021 and sees in infrared?', ['Hubble', 'Kepler', 'Spitzer', 'James Webb'], 3, 'The James Webb Space Telescope looks at very old, distant galaxies.'],
    ['What causes the auroras (northern lights)?', ['Moonlight on snow', 'Particles from the Sun hitting Earth\'s air', 'Volcano smoke', 'Reflections from the sea'], 1, 'Charged particles from the Sun make the air glow near the poles.'],
    ['Why do astronauts\' bones get weaker in space?', ['They eat less calcium only', 'The air is too dry', 'Bones do not have to hold up the body\'s weight', 'Space radiation melts them'], 2, 'Without weight to carry, bones lose strength, so astronauts exercise.'],
    ['Which planet has a day that is longer than its year?', ['Mercury', 'Venus', 'Mars', 'Jupiter'], 1, 'Venus spins so slowly that one day lasts longer than its trip around the Sun.'],
    ['What is the Great Red Spot?', ['A volcano on Mars', 'A crater on the Moon', 'A giant storm on Jupiter', 'A rust patch on Mercury'], 2, 'It is a storm bigger than Earth that has lasted for hundreds of years.'],
    ['What type of galaxy is the Milky Way?', ['Spiral', 'Round ball', 'Square', 'Ring only'], 0, 'The Milky Way is a barred spiral galaxy.'],
    ['About how fast does the space station travel?', ['2,800 km per hour', '28,000 km per hour', '280,000 km per hour', '28 km per hour'], 1, 'The station moves at about 28,000 kilometers per hour, so it circles Earth in 90 minutes.'],
    ['What is a "sol"?', ['A Martian day', 'A type of rocket', 'A solar flare', 'A Moon crater'], 0, 'A sol is one day on Mars, about 24 hours and 40 minutes.'],
    ['What does EVA stand for?', ['Earth Viewing Area', 'Extravehicular activity', 'Engine Valve Alert', 'Extra Vacuum Air'], 1, 'Extravehicular activity is the official name for a spacewalk.'],
    ['What is the Oort Cloud?', ['A cloud on Venus', 'A nebula near Orion', 'A shell of icy objects far beyond Neptune', 'The tail of a comet'], 2, 'Many comets come from the distant, icy Oort Cloud.'],
    ['Which planet has the most known moons?', ['Saturn', 'Earth', 'Mars', 'Mercury'], 0, 'Saturn has well over 100 known moons.'],
    ['What was the first spacecraft to orbit Mars, in 1971?', ['Mariner 9', 'Viking 1', 'Sojourner', 'Pathfinder'], 0, 'Mariner 9 mapped Mars from orbit.'],
    ['Why do telescopes like Webb sit far from Earth at a point called L2?', ['It is where the Moon hides', 'It is warmer there', 'Earth and Sun are in one direction, so it stays cold and steady', 'There is no gravity there'], 2, 'At L2 the Sun, Earth and Moon are all on one side, which keeps the telescope cold.']
  ].map(_q)
};

/* [statement, true?, explanation] */
const FACT_BANK = {
  1: [
    ['There is no sound in space because there is no air to carry it.', true, 'Sound needs air or another material to travel through.'],
    ['Astronauts float because there is no gravity at the space station.', false, 'Gravity is still strong there. They float because they are in constant free fall around Earth.'],
    ['A day on Venus is longer than its year.', true, 'Venus spins so slowly that one turn takes longer than one trip around the Sun.'],
    ['The Sun is a planet.', false, 'The Sun is a star.'],
    ['The Moon has a night that lasts about 14 Earth days.', true, 'The Moon turns slowly, so its night is very long.'],
    ['Mars looks red because of rusty iron dust.', true, 'Iron in the dust reacts with oxygen, like rust on Earth.'],
    ['Astronauts can grow a little taller in space.', true, 'Their spines stretch without gravity pressing down.'],
    ['Saturn is the only planet with rings.', false, 'Jupiter, Uranus and Neptune have rings too.'],
    ['The space station circles Earth about every 90 minutes.', true, 'That is why the crew sees about 16 sunrises a day.'],
    ['Radio messages from Mars reach Earth instantly.', false, 'They take between 3 and 22 minutes each way.'],
    ['Jupiter is the largest planet in our solar system.', true, 'More than 1,000 Earths could fit inside it.'],
    ['Stars twinkle because space is windy.', false, 'Twinkling happens when starlight passes through Earth\'s moving air.'],
    ['Spacewalkers use tethers so they do not drift away.', true, 'Tools are tethered too.'],
    ['The Moon makes its own light.', false, 'It reflects sunlight.'],
    ['The Earth is flat.', false, 'Earth is a ball, a little squashed at the poles.'],
    ['Jupiter is bigger than Earth.', true, 'Jupiter is the biggest planet of all.'],
    ['Astronauts sleep in sleeping bags tied to the wall.', true, 'Without gravity, they would float around if they were not tied down.'],
    ['The Moon is made of cheese.', false, 'The Moon is made of rock and dust.'],
    ['Rockets need fuel to reach space.', true, 'Burning fuel gives the huge push for liftoff.'],
    ['Earth is the third planet from the Sun.', true, 'Mercury and Venus are closer to the Sun.']
  ],
  2: [
    ['Mercury is the hottest planet.', false, 'Venus is hotter because its thick air traps heat.'],
    ['A year on Mercury is shorter than a year on Earth.', true, 'Mercury circles the Sun in only 88 Earth days.'],
    ['Sunlight takes about 8 minutes to reach Earth.', true, 'The Sun is about 150 million kilometers away.'],
    ['Pluto is classified as a planet.', false, 'Pluto is a dwarf planet.'],
    ['Neptune takes about 165 Earth years to orbit the Sun.', true, 'It is so far away that one trip takes a very long time.'],
    ['There is water ice on the Moon.', true, 'Ice hides in deep craters near the Moon\'s poles.'],
    ['The Sun is the biggest star in the universe.', false, 'Many stars are far bigger than the Sun.'],
    ['Mars has two moons.', true, 'They are called Phobos and Deimos.'],
    ['Venus spins backwards compared with most planets.', true, 'On Venus, the Sun rises in the west.'],
    ['Gravity at the space station is almost as strong as on the ground.', true, 'It is about 90 percent. The crew floats because they are falling around Earth.'],
    ['A comet\'s tail points toward the Sun.', false, 'The tail points away from the Sun, pushed by sunlight and solar wind.'],
    ['The Great Wall of China is easy to see from the Moon.', false, 'No human-made building can be seen from the Moon.'],
    ['Saturn is light enough that it would float in water.', true, 'Saturn is mostly gas, so it is less dense than water.'],
    ['The Milky Way is the only galaxy.', false, 'There are billions of galaxies.'],
    ['Footprints on the Moon can last for millions of years.', true, 'There is no wind or rain on the Moon to wash them away.'],
    ['Space is completely, perfectly empty.', false, 'Space holds a tiny amount of gas and dust.'],
    ['Uranus spins on its side.', true, 'Its tilt is about 98 degrees.'],
    ['An astronaut\'s helmet visor protects against bright sunlight.', true, 'A gold-coated visor blocks harmful glare.']
  ],
  3: [
    ['A neutron star can spin hundreds of times every second.', true, 'Fast-spinning neutron stars are called pulsars.'],
    ['One day the Sun will swell into a red giant.', true, 'That will happen in about five billion years.'],
    ['Sound travels faster in space than on Earth.', false, 'Sound cannot travel through the vacuum of space at all.'],
    ['Jupiter\'s moon Io has active volcanoes.', true, 'Io is the most volcanic place in the solar system.'],
    ['The Hubble telescope orbits the Sun.', false, 'Hubble orbits Earth.'],
    ['Olympus Mons on Mars is taller than Mount Everest.', true, 'It is about three times as tall.'],
    ['The space station can be seen from Earth with the naked eye.', true, 'It looks like a fast, bright star moving across the sky.'],
    ['A black hole sucks in everything nearby like a vacuum cleaner.', false, 'Far away, objects can orbit a black hole just as they orbit any star.'],
    ['A day on Mars is about 24 hours and 40 minutes.', true, 'That is why Mars days have their own name: sols.'],
    ['Neptune\'s big moon Triton orbits backwards.', true, 'Triton goes the opposite way from Neptune\'s spin.'],
    ['Earth\'s air is mostly oxygen.', false, 'It is about 78 percent nitrogen and 21 percent oxygen.'],
    ['The Moon is slowly moving away from Earth.', true, 'It drifts away about 3.8 centimeters every year.'],
    ['Titan, a moon of Saturn, has lakes of liquid methane.', true, 'It is the only moon known with lakes on its surface.'],
    ['Voyager 1 was launched in 1977.', true, 'It was launched in 1977 and has traveled farther than any other spacecraft.'],
    ['All planets spin in the same direction.', false, 'Venus and Uranus spin differently from most planets.'],
    ['Mars has a canyon system much longer than the Grand Canyon.', true, 'Valles Marineris stretches about 4,000 kilometers.'],
    ['Stars are born inside giant clouds of gas and dust.', true, 'These clouds are called nebulae.'],
    ['Lightning cannot happen on any planet except Earth.', false, 'Jupiter and Saturn have lightning too.']
  ]
};

/* WORD_BANK: w = the word, h = clue, e = picture */
const WORD_BANK = {
  1: [
    { w: 'MOON',   h: 'It circles Earth and glows at night.', e: '🌙' },
    { w: 'STAR',   h: 'The Sun is one of these.', e: '⭐' },
    { w: 'MARS',   h: 'The red planet.', e: '🔴' },
    { w: 'EARTH',  h: 'The planet we live on.', e: '🌍' },
    { w: 'ROCKET', h: 'It blasts astronauts into space.', e: '🚀' },
    { w: 'ORBIT',  h: 'The path around a planet or star.', e: '🔄' },
    { w: 'COMET',  h: 'An icy visitor with a glowing tail.', e: '☄️' },
    { w: 'VENUS',  h: 'The hottest planet.', e: '🟡' },
    { w: 'SPACE',  h: 'Where astronauts work.', e: '🌌' },
    { w: 'ALIEN',  h: 'An imaginary visitor from another world.', e: '👽' },
    { w: 'PLUTO',  h: 'A small, icy dwarf planet.', e: '🧊' },
    { w: 'LUNAR',  h: 'It means "of the Moon".', e: '🌙' },
    { w: 'SOLAR',  h: 'It means "of the Sun".', e: '☀️' },
    { w: 'ROVER',  h: 'It drives around on Mars.', e: '🚙' },
    { w: 'LAUNCH', h: 'The moment a rocket leaves the ground.', e: '🚀' }
  ],
  2: [
    { w: 'GALAXY',   h: 'A huge group of stars, like the Milky Way.', e: '🌌' },
    { w: 'PLANET',   h: 'Earth is one.', e: '🪐' },
    { w: 'METEOR',   h: 'A shooting star.', e: '🌠' },
    { w: 'GRAVITY',  h: 'The force that pulls things down.', e: '🍎' },
    { w: 'NEBULA',   h: 'A cloud where stars are born.', e: '🌫️' },
    { w: 'JUPITER',  h: 'The biggest planet.', e: '🪐' },
    { w: 'SATURN',   h: 'The planet with big rings.', e: '🪐' },
    { w: 'MERCURY',  h: 'The closest planet to the Sun.', e: '🌑' },
    { w: 'NEPTUNE',  h: 'The farthest planet from the Sun.', e: '🔵' },
    { w: 'URANUS',   h: 'A planet that spins on its side.', e: '🧊' },
    { w: 'COSMOS',   h: 'Another name for the universe.', e: '🌌' },
    { w: 'CAPSULE',  h: 'The small cabin that carries a crew.', e: '🚀' },
    { w: 'LANDER',   h: 'It touches down on the Moon or Mars.', e: '🛬' },
    { w: 'ECLIPSE',  h: 'When the Moon blocks the Sun.', e: '🌑' },
    { w: 'ASTEROID', h: 'A rocky space rock.', e: '☄️' }
  ],
  3: [
    { w: 'ASTRONAUT',     h: 'A space traveler.', e: '🧑‍🚀' },
    { w: 'SATELLITE',     h: 'It circles Earth and sends signals.', e: '🛰️' },
    { w: 'TELESCOPE',     h: 'It helps us see faraway stars.', e: '🔭' },
    { w: 'SPACECRAFT',    h: 'Any vehicle that travels in space.', e: '🚀' },
    { w: 'ATMOSPHERE',    h: 'The layer of air around a planet.', e: '🌍' },
    { w: 'SUPERNOVA',     h: 'A giant exploding star.', e: '💥' },
    { w: 'LIGHTYEAR',     h: 'The distance light travels in one year.', e: '✨' },
    { w: 'SPACESUIT',     h: 'It keeps an astronaut alive outside.', e: '🧑‍🚀' },
    { w: 'COSMONAUT',     h: 'A Russian astronaut.', e: '🧑‍🚀' },
    { w: 'METEORITE',     h: 'A space rock that lands on Earth.', e: '🪨' },
    { w: 'UNIVERSE',      h: 'Everything that exists.', e: '🌌' },
    { w: 'SPACEWALK',     h: 'Working outside the station.', e: '🧑‍🚀' },
    { w: 'CONSTELLATION', h: 'A pattern of stars, like Orion.', e: '⭐' },
    { w: 'OBSERVATORY',   h: 'A building with big telescopes.', e: '🔭' },
    { w: 'MICROGRAVITY',  h: 'The floating feeling in orbit.', e: '🪶' }
  ]
};
