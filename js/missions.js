/* missions.js — all content lives here. Add or edit entries to grow the game. */

const XP_PER_LEVEL = 500;
const MODULE_XP = 25;   // XP for finishing a training module
const STEP_XP = 20;     // XP for each correct mission answer

const MODULES = [
  { id: 'ops', title: 'Spacecraft Operations', icon: '🛰️', color: '#1d4fb8',
    lesson: [
      'The International Space Station circles Earth about every 90 minutes, roughly 400 km up.',
      'Astronauts see about 16 sunrises and sunsets every day.',
      'Mission Control on the ground monitors power, air, water and temperature around the clock.',
      'Every system has a checklist: crews follow it step by step, even for small problems.'
    ] },
  { id: 'walk', title: 'Spacewalk Training', icon: '🧑‍🚀', color: '#16509e',
    lesson: [
      'A spacewalk is also called an EVA (extravehicular activity).',
      'Astronauts clip tethers to the station so they never drift away.',
      'They train underwater in a huge pool because water mimics weightlessness.',
      'Spacewalkers always work with a partner and talk with Mission Control throughout.'
    ] },
  { id: 'sci', title: 'Scientific Research', icon: '🌱', color: '#21679a',
    lesson: [
      'Astronauts run experiments in microgravity that are impossible on Earth.',
      'Plants have been grown on the station to study how crops could feed future crews.',
      'Research covers medicine, materials, fluids, fire behavior and more.',
      'Careful notes and photos make sure scientists on the ground can repeat the results.'
    ] },
  { id: 'robot', title: 'Robotics & Equipment', icon: '🦾', color: '#1a3f8c',
    lesson: [
      'The station has a large robotic arm, Canadarm2, used to move cargo and help spacewalkers.',
      'Robots can do dangerous or repetitive jobs so crew can focus on science.',
      'Tools in space are tethered too, because a dropped tool floats away.',
      'Before using any equipment, crews read the procedure and check it is safe to power on.'
    ] },
  { id: 'emerg', title: 'Emergency Response', icon: '🚨', color: '#8c2a2a',
    lesson: [
      'The three main station emergencies are fire, rapid pressure loss and toxic air.',
      'First step: alert everyone and tell Mission Control.',
      'Crews can close hatches to isolate a damaged module.',
      'Staying calm and following the checklist saves time and lives.'
    ] },
  { id: 'team', title: 'Team Communication', icon: '🎧', color: '#215a8f',
    lesson: [
      'Crews repeat instructions back ("read back") so nothing gets misunderstood.',
      'Short, clear messages work best on a radio loop.',
      'Everyone is encouraged to speak up if something looks wrong.',
      'Good teamwork matters as much as technical skill on long missions.'
    ] },
  { id: 'fit', title: 'Health & Fitness', icon: '🏋️', color: '#1b4a85',
    lesson: [
      'In weightlessness muscles and bones weaken, so astronauts exercise about two hours a day.',
      'Equipment includes a treadmill, a bike and a resistance machine.',
      'Straps hold astronauts in place while they work out.',
      'Sleep, food and mental health are part of mission planning too.'
    ] }
];

const MISSIONS = [
  { id: 'iss', title: 'Save the Space Station', icon: '🛰️',
    brief: 'A critical system is malfunctioning on the ISS. Investigate and choose the best response.',
    steps: [
      { q: 'An alarm sounds: cabin pressure in one module is dropping slowly. What do you do first?',
        options: ['Ignore it until it drops further', 'Alert the crew and Mission Control right away', 'Open every hatch to let air flow', 'Turn off all the lights'],
        answer: 1, why: 'Always raise the alarm first so the whole team and Mission Control can respond together.',
        hint: 'Teamwork starts with telling people.' },
      { q: 'The crew suspects a leak. How do you stop air from escaping to the rest of the station?',
        options: ['Close the hatch to isolate the affected module', 'Leave the hatch open to check the leak', 'Wait for the next supply ship', 'Reduce the temperature'],
        answer: 0, why: 'Closing the hatch isolates the problem and protects the rest of the station.',
        hint: 'Think about sealing off the damaged area.' },
      { q: 'How can the crew find where the leak is?',
        options: ['Guess and patch randomly', 'Use a leak detector and follow the checklist', 'Shout loudly and listen', 'Skip it and go to sleep'],
        answer: 1, why: 'Instruments plus a checklist find the leak quickly and safely. Guessing wastes precious time.',
        hint: 'Scientists trust tools and procedures.' }
    ] },
  { id: 'array', title: 'Solar Array Repair', icon: '☀️',
    brief: 'A solar panel is stuck. Plan a safe spacewalk to fix it.',
    steps: [
      { q: 'Before leaving the airlock, what must every spacewalker do?',
        options: ['Check the suit and clip on safety tethers', 'Remove the helmet to see better', 'Skip the checks to save time', 'Go out alone'],
        answer: 0, why: 'Suit checks and tethers keep spacewalkers alive and attached to the station.',
        hint: 'Safety gear comes first.' },
      { q: 'You drop a tool outside. What is the best reaction?',
        options: ['Chase it as fast as you can', 'Tell Mission Control and keep your tethers secure', 'Unclip to grab it', 'Throw another tool after it'],
        answer: 1, why: 'A lost tool is replaceable. A lost astronaut is not.',
        hint: 'Never unclip for a tool.' },
      { q: 'Why do astronauts always spacewalk in pairs?',
        options: ['It is more fun', 'They can watch out for each other and share the work', 'Suits only work in pairs', 'To save oxygen'],
        answer: 1, why: 'A buddy spots problems early and can help in an emergency.',
        hint: 'Think about the buddy system.' }
    ] },
  { id: 'fire', title: 'Fire in the Lab', icon: '🔥',
    brief: 'Smoke is detected in the science lab. React fast and keep the crew safe.',
    steps: [
      { q: 'The smoke alarm goes off. What is the first action?',
        options: ['Call out "fire" and alert everyone', 'Open a window', 'Finish your experiment', 'Hide in your sleeping bag'],
        answer: 0, why: 'Everyone needs to know immediately so they can respond.',
        hint: 'Warn the crew.' },
      { q: 'The smoke seems to come from one powered device. What is the best step?',
        options: ['Pour water on it', 'Switch off power to that equipment', 'Cover it with paper', 'Leave it running to see'],
        answer: 1, why: 'Cutting power removes the cause of an electrical fire.',
        hint: 'No power means no spark.' },
      { q: 'Smoke is spreading. What protects the crew while they respond?',
        options: ['Holding their breath', 'Wearing breathing masks and following the checklist', 'Sitting still', 'Closing their eyes'],
        answer: 1, why: 'Masks protect lungs, and the checklist keeps actions in the right order.',
        hint: 'Protect your breathing.' }
    ] },

  /* ---------- new missions ---------- */
  { id: 'dock', title: 'Dock the Cargo Ship', icon: '📦',
    brief: 'A cargo spacecraft is arriving with food and supplies. Help the crew bring it in safely.',
    steps: [
      { q: 'The cargo ship is approaching the station. Who should the crew stay in contact with during the approach?',
        options: ['Nobody, the ship docks by itself', 'Mission Control, to confirm each step of the approach', 'Only the other astronauts, in silence', 'A passing satellite'],
        answer: 1, why: 'The crew and Mission Control confirm every step together, even when the ship is automatic.',
        hint: 'Teamwork between space and ground.' },
      { q: 'A sensor shows a warning just before capture. What is the safest choice?',
        options: ['Ignore the warning and keep going', 'Speed up to finish sooner', 'Pause or abort the approach and check the problem', 'Turn off all the sensors'],
        answer: 2, why: 'A pause costs a little time. A bad docking could damage the station, so when unsure, stop and check.',
        hint: 'Safety is more important than speed.' },
      { q: 'The ship is very close. What helps catch it and guide it to the station?',
        options: ['Throwing a rope at it', 'The robotic arm, Canadarm2', 'Waiting for it to bump the station', 'Pushing it by hand from the airlock'],
        answer: 1, why: 'Some cargo ships are caught by the robotic arm and then gently attached to the station.',
        hint: 'Remember the big robot arm.' }
    ] },
  { id: 'debris', title: 'Space Debris Alert', icon: '☄️',
    brief: 'Ground radar spots a piece of old satellite heading toward the station. Keep everyone safe.',
    steps: [
      { q: 'Mission Control warns that debris may pass very close in a few hours. What is the best first response?',
        options: ['Ignore it, space is empty', 'Stay calm and prepare with the checklist, guided by Mission Control', 'Panic and shout', 'Open all the hatches'],
        answer: 1, why: 'An early warning gives time to prepare. A calm checklist plan works better than panic.',
        hint: 'Stay calm and follow the plan.' },
      { q: 'If the debris will pass too close, what can the station do?',
        options: ['Fire its thrusters to move to a safer path', 'Turn the lights off to hide', 'Hope it misses', 'Paint the station black'],
        answer: 0, why: 'Controllers can fire thrusters to nudge the station out of the way before the debris arrives.',
        hint: 'Think about changing the station path.' },
      { q: 'A close pass is still possible. Where should the crew wait?',
        options: ['Spread out in every module', 'Outside on a spacewalk to watch', 'Inside the docked crew spacecraft, ready to leave if needed', 'Next to the biggest window'],
        answer: 2, why: 'Crews gather in their escape spacecraft so they can leave quickly if the station is damaged.',
        hint: 'Stay near your lifeboat.' }
    ] },
  { id: 'storm', title: 'Solar Storm Shelter', icon: '☀️',
    brief: 'Space weather scientists report a strong solar flare. Protect the crew from radiation.',
    steps: [
      { q: 'A strong solar flare is on the way. What gives the crew an early warning?',
        options: ['Space weather monitoring by agencies like NASA', 'Looking at the Sun through a window', 'Guessing', 'Checking the lunch menu'],
        answer: 0, why: 'Satellites watch the Sun and warn about flares. You can see this kind of data on the NASA Live page.',
        hint: 'Satellites and scientists watch the Sun for us.' },
      { q: 'A radiation storm is arriving. What should the crew do?',
        options: ['Start a spacewalk to take photos', 'Move to the best-shielded part of the station', 'Open the hatches to the outside', 'Do nothing special'],
        answer: 1, why: 'Thicker walls and equipment block more radiation, so crews go to shielded areas during storms.',
        hint: 'More walls means less radiation.' },
      { q: 'A spacewalk was planned for today. What is the best decision?',
        options: ['Go ahead, it is only a little radiation', 'Send one person alone to be quick', 'Postpone the spacewalk until the storm passes', 'Cancel every future spacewalk'],
        answer: 2, why: 'Outside there are no walls to protect you, so the safe choice is to wait.',
        hint: 'Outside, nothing shields you.' }
    ] },
  { id: 'medical', title: 'Medical Emergency', icon: '🩺',
    brief: 'A crew member feels very unwell, far from any hospital. Work together to help.',
    steps: [
      { q: 'A crewmate feels dizzy and unwell. What do you do first?',
        options: ['Tell them to ignore it', 'Stay with them and tell the crew and Mission Control', 'Leave them alone to rest', 'Wait until tomorrow'],
        answer: 1, why: 'Never leave someone alone. Alert the crew and ask for help from the doctors on the ground.',
        hint: 'Never leave a teammate alone.' },
      { q: 'Who on the ground can give medical advice in real time?',
        options: ['A flight surgeon at Mission Control', 'The nearest pizza shop', 'Nobody, astronauts are on their own', 'A passing spacecraft'],
        answer: 0, why: 'Flight surgeons are doctors who support the crew from Earth through radio, video and data links.',
        hint: 'Think of a doctor on the ground.' },
      { q: 'The doctor gives step-by-step instructions. How can the crew make sure they understood?',
        options: ['Nod and hope for the best', 'Skip the hard steps', 'Guess the rest', 'Read the instructions back out loud'],
        answer: 3, why: 'Reading instructions back catches mistakes before they matter.',
        hint: 'Remember the Team Communication module.' }
    ] },
  { id: 'power', title: 'Power Failure', icon: '🔋',
    brief: 'A solar array fault drops the station power. Decide what to keep running.',
    steps: [
      { q: 'Power is falling fast. Which system must stay on first?',
        options: ['Life support (air, water and temperature)', 'The movie projector', 'Extra lights in every module', 'The treadmill'],
        answer: 0, why: 'Air, water and temperature keep the crew alive, so they come before everything else.',
        hint: 'What do humans need to survive?' },
      { q: 'How can the crew save power until the fault is fixed?',
        options: ['Turn everything on to test it', 'Open the hatches', 'Switch off equipment that is not essential', 'Charge more devices'],
        answer: 2, why: 'Power is a budget. Turning off non-essential equipment makes the batteries last longer.',
        hint: 'Spend power wisely, like in Outpost Survival.' },
      { q: 'The station is about to pass into Earth shadow. What matters most?',
        options: ['Run all equipment at full power', 'Plan carefully, because the panels make no power in the dark', 'Turn off life support to save power', 'Ignore the batteries'],
        answer: 1, why: 'Solar panels only make power in sunlight, so batteries must cover the dark part of each orbit.',
        hint: 'Batteries power the station at night.' }
    ] },
  { id: 'mars', title: 'Journey to Mars', icon: '🔴',
    brief: 'Your crew is on the way to Mars. Messages to Earth take minutes. Make smart decisions.',
    steps: [
      { q: 'An urgent alarm sounds, and a reply from Earth would take many minutes. What should the crew do?',
        options: ['Follow the emergency checklist themselves right away', 'Wait for Earth to answer first', 'Ignore the alarm', 'Send a message and take a nap'],
        answer: 0, why: 'On long trips, crews must act on their own in fast emergencies and update Earth afterwards.',
        hint: 'Earth is too far to help in seconds.' },
      { q: 'The trip takes many months. What must the crew plan very carefully?',
        options: ['Only snacks', 'Nothing, they can get more on the way', 'Just books', 'Food, water, oxygen and spare parts'],
        answer: 3, why: 'There are no shops in space. Everything must be packed, recycled or grown.',
        hint: 'There are no stores on the way.' },
      { q: 'Far from Earth, radiation is a bigger risk. What helps protect the crew?',
        options: ['Taking off their suits', 'Shielded shelter areas and watching space weather', 'Flying faster with the lights on', 'Nothing can help'],
        answer: 1, why: 'Shielding and space weather warnings let the crew shelter before strong radiation arrives.',
        hint: 'Think about Solar Storm Shelter.' }
    ] }
];

const RIVALS = [
  { name: 'Nova Cadet', xp: 480 },
  { name: 'Orbit Ace', xp: 360 },
  { name: 'Comet Kid', xp: 250 },
  { name: 'Lunar Scout', xp: 90 }
];

/* Astro's quick answers: first matching keyword wins. */
const ASTRO_FACTS = [
  { k: ['spacewalk', 'eva'], a: 'A spacewalk (EVA) means working outside the station in a suit. Astronauts clip on tethers, work in pairs and train underwater first. Try the Spacewalk Training module!' },
  { k: ['iss', 'station'], a: 'The ISS orbits Earth about every 90 minutes at roughly 400 km high, so the crew sees around 16 sunrises a day.' },
  { k: ['gravity', 'float', 'weightless'], a: 'Astronauts feel weightless because they are in constant free fall around Earth, not because there is no gravity.' },
  { k: ['exercise', 'fitness', 'muscle'], a: 'Astronauts exercise about two hours a day to keep muscles and bones strong in microgravity.' },
  { k: ['emergency', 'fire', 'leak'], a: 'In an emergency: alert the crew and Mission Control, isolate the problem, then follow the checklist.' },
  { k: ['xp', 'level'], a: 'You earn 25 XP for finishing a training module and 20 XP for each correct mission answer. Every 500 XP is a new level!' },
  { k: ['debris', 'junk'], a: 'Space debris is old satellites and rocket pieces zooming around Earth. Radar tracks them, and the station can fire its thrusters to dodge a close pass.' },
  { k: ['flare', 'radiation', 'solar storm'], a: 'A solar flare is a burst of energy from the Sun. Crews shelter in well-shielded areas and postpone spacewalks. Check the NASA Live page for space weather!' },
  { k: ['dock', 'cargo'], a: 'Cargo ships bring food and supplies. Some are caught by the robotic arm Canadarm2, and others dock automatically while Mission Control and the crew watch every step.' },
  { k: ['battery', 'power'], a: 'Solar panels make power in sunlight and batteries cover the dark part of each orbit. When power is low, life support always stays on first.' }
];

/* ---------- Outpost Survival: manage a Moon or Mars outpost (game data) ---------- */
const OUTPOST = {
  days: 20,            // mission length
  mass: 70,            // launch mass budget
  sciGoal: 30,         // science points for full success
  doseLimit: 60,       // radiation dose the crew must stay under
  panelPower: 8,       // power one solar panel makes in full sunlight
  crew: { o2: 4, water: 4, food: 4 },              // used per day by 4 astronauts
  base: { cap: 20, o2: 30, water: 30, food: 30 },  // what the lander already carries
  xpByRank: [0, 40, 80],                           // fail, survived, mission success

  sites: {
    moon: { id: 'moon', name: 'Lunar outpost', icon: '🌙', delay: '1.3 seconds', late: false, rad: 3,
      sun: d => (d <= 6 ? 1 : 0),
      sunNote: 'Sunlit on days 1 to 6, then 14 nights of total darkness with no solar power.',
      facts: ['Long night: about 14 Earth days without sunlight',
              'No air or magnetic field, so radiation is strong every day',
              'Messages reach Earth in about 1.3 seconds'] },
    mars: { id: 'mars', name: 'Mars outpost', icon: '🔴', delay: '3 to 22 minutes', late: true, rad: 1.5,
      sun: d => (d >= 8 && d <= 13 ? 0.15 : 0.5),
      sunNote: 'Mars gets about half of Earth\'s sunlight, and a dust storm blocks most of it on days 8 to 13.',
      facts: ['Dust storms can block solar panels for weeks',
              'Thin air and the planet itself block some radiation',
              'Messages take 3 to 22 minutes each way, so Earth cannot help in a fast emergency'] },

    pole: { id: 'pole', short: 'Moon Pole', name: 'Lunar south pole base', icon: '🏔️', delay: '1.3 seconds', late: false, rad: 2.5,
      sun: d => (d >= 9 && d <= 10 ? 0.2 : 0.9),
      sunNote: 'Crater rims at the Moon\'s pole stay in sunlight almost all the time. Only days 9 and 10 fall into a long shadow.',
      facts: ['Peaks of eternal light: solar panels work almost every day',
              'Deep craters nearby hold frozen water ice',
              'Messages reach Earth in about 1.3 seconds'] },

    ceres: { id: 'ceres', short: 'Ceres', name: 'Ceres asteroid outpost', icon: '🪨', delay: '15 to 25 minutes', late: true, rad: 2,
      sun: () => 0.13,
      sunNote: 'Ceres is so far from the Sun that it gets only about 13% of the sunlight Earth gets. Solar panels barely help.',
      facts: ['Very dim sunlight, so batteries matter more than panels',
              'No air and no magnetic field, so radiation reaches the ground',
              'Messages take 15 to 25 minutes each way, so the crew must be independent'] }
  },

  // Things you can pack. Each costs launch mass.
  items: [
    { id: 'bat',    name: 'Battery pack',     icon: '🔋', mass: 8, max: 4, res: 'cap',   amt: 25, text: 'Stores +25 power' },
    { id: 'sol',    name: 'Solar panel',      icon: '☀️', mass: 8, max: 4, text: 'Makes power in sunlight, nothing in the dark' },
    { id: 'ox',     name: 'Oxygen tank',      icon: '🫧', mass: 5, max: 4, res: 'o2',    amt: 24, text: '+24 oxygen' },
    { id: 'wat',    name: 'Water tank',       icon: '💧', mass: 5, max: 4, res: 'water', amt: 24, text: '+24 water' },
    { id: 'food',   name: 'Food crate',       icon: '📦', mass: 5, max: 4, res: 'food',  amt: 20, text: '+20 food' },
    { id: 'shield', name: 'Radiation shield', icon: '🛡️', mass: 9, max: 3, text: 'Each layer cuts radiation dose by 20%' }
  ],

  // Daily systems. power[] and fx[] are for Off / Eco / Full. pause = stops during a storm shelter.
  systems: [
    { id: 'life', name: 'Life support', icon: '🫧', power: [0, 2, 4], fx: { o2: [0, 2, 4], water: [0, 2, 4] },
      tips: ['Off: no oxygen made, no water recycled', 'Eco: makes 2 oxygen and recycles 2 water', 'Full: makes 4 oxygen and recycles 4 water, so both hold steady'] },
    { id: 'farm', name: 'Greenhouse', icon: '🌱', power: [0, 2, 4], pause: true, fx: { food: [0, 3, 6], water: [0, -1, -2] },
      tips: ['Off: no food grown, no water used', 'Eco: grows 3 food, uses 1 water', 'Full: grows 6 food, uses 2 water'] },
    { id: 'lab', name: 'Science lab', icon: '🔬', power: [0, 2, 4], pause: true, fx: { sci: [0, 2, 5] },
      tips: ['Off: no science', 'Eco: 2 science points', 'Full: 5 science points'] }
  ],

  // Emergencies. fast = needs a decision in minutes, so Earth's answer can arrive too late on Mars.
  // fx(g, m) changes the game; m is the radiation multiplier your shield layers give you.
  events: [
    { id: 'storm', fast: true, day: { moon: 5, mars: 7, pole: 6, ceres: 9 }, title: '☀️ Solar storm warning',
      text: 'A burst of radiation from the Sun will reach the outpost within minutes.', best: 0,
      choices: [
        { t: 'Shelter in the storm room (lab and greenhouse pause today)', fx: (g, m) => { g.dose += 3 * m; g.paused = true; return 'The crew sheltered and took only a small dose.'; } },
        { t: 'Keep working as normal',                                      fx: (g, m) => { g.dose += 30 * m; return 'The crew took a large radiation dose.'; } }
      ] },
    { id: 'leak', fast: true, day: { moon: 10, mars: 12, pole: 11, ceres: 13 }, title: '🚨 Air leak',
      text: 'An alarm sounds. Air is escaping from a module.', best: 0,
      choices: [
        { t: 'Close the hatch and patch the leak now', fx: g => { g.o2 -= 4;  return 'You sealed it fast and lost only 4 oxygen.'; } },
        { t: 'Finish your tasks first',                fx: g => { g.o2 -= 14; return 'The leak ran for a while and you lost 14 oxygen.'; } }
      ] },
    { id: 'conv', fast: false, day: { moon: 15, mars: 16, pole: 14, ceres: 17 }, title: '⚡ Power converter fault',
      text: 'The main power converter is failing. It is not an emergency, but it needs a careful fix.',
      choices: [
        { t: 'Guess at a fix yourselves',             fx: g => { g.power -= 10; return 'The guess damaged a part: 10 power lost.'; } },
        { t: 'Shut it down and use backup circuits',  fx: g => { g.power -= 6;  return 'Backup circuits wasted 6 power.'; } }
      ],
      expert: { fx: g => { g.power -= 2; return 'Engineers sent the exact repair procedure: only 2 power lost.'; } } }
  ]
};