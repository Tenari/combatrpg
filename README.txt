# Setup

```
  git clone https://github.com/Tenari/combatrpg.git
  cd combatrpg
  curl https://install.meteor.com/ | sh
  meteor
```

potential names:
- Fantasy Fighter RPG
- The tournament Arc
- Combat RPG

The game im trying to mull together in my head:
  - is a browser MMOG
  - is a fantasy RPG
  - is 2D pixel-art
  - uses skills/spells trees, unlocked by XP, which allow users to create their class out of the skills they get instead of picking a class at the beginning
  - constrains player action with pardus-like AP system
  - incorporates pardus-like teamwork mechanics
  - has a proficiency tied to each skill which is ln(x) improved by use of the skill, allowing specialization to matter
  - has perma-death
    - you die, you lose all your skills/spells/XP, plus everything you're carrying can be looted
  - gives XP based on relative difficulty of the challenge (which reduces grinding and increases exploration needs since you don't care about killing noobs over and over, but instead try to find rare challenging things to fight/do)
  - rewards non-violent playstyles (trader, crafter, etc)
  - motivates players to squabble over territory
  - combat occurs in fighter-game style realtime button-masher

Play styles:
  warrior
    melee
    range
    magic
  crafter
    smithing
    enchanting
    alchemy
  trader
    mining

too complex ^

=======================================================

super simple version: A Fighting RPG

- 2 world mode views: pokemon walking about + street fighter combat
- 1 combat tree: sword
- killing monsters gives you gold and xp based on how difficult the monster was
    (monster = your level? 100 xp. monster = your level - 1 ? 10 xp. -2 ? 1 xp -3? 0xp. your lvl + 1? 200xp. your lvl +2? 300xp.) (linear xp gain, exponention xp decay)
- can attack other players
- can trade other players
- death => lose a level (and your most recent skill), all gold and items you were carrying
- world consists of 1 town, surrounded by wilderness in all directions, which gets progressively more deadly
- gear consists of armor and sword + sword or sword + shield
- use gold to buy/repair gear
- weekly tournament crowns winner on leaderboard, gives gold, everyone else dies
- your house is your own inaccessible portal world that everyone enters from the same place on the map, but ends up in their own house.
- killing players in a non-duel results in a bounty being on your head

v 0.001 = fight component has peer 2 peer connection, synced game simulation with rollback and two movable entities (need to decide on physics framework?)
v 0.01 = can walk around in the overworld (tiny map, 1 squirrel enemy)
v 0.02 = can enter fight mode
v 0.03 = can fight + die
v 0.04 = character management view/menus
v 0.041 = sleeping in bed restores health
v 0.05 = can get $ + xp
v 0.06 = can equip items

COMBAT

sword
  stab (light attack)
    slash (medium)
     stab-slash combo
    overhand (heavy)
    feint
  parry
    counter-stab
    counter-slash
unarmed
  jab
    reverse
      1-2 combo
    uppercut
  kick
  block
movement
  duck
    dodge-in-place
  dash
  jump

MONSTERS

squirrel, faries
wolf
bear
dragon


===========================================================

Fights happen over a peerJS connection
  20ms per frame
  on browser input event, store valid inputs in inputQueue
  on peerJS data (input) event store in opponentInputQueue 
  Infinite game loop
    return unless time moved forward at least 20ms from last frame

    if opponentInputQueue has stuff in it
      if the inputs matched our predictions
        remove the inputs
      else
        rollback to the frame where it diverged (just involves reading the old game state out of memory)
        simulateFrame(state, userInput, opponentInput) for the divergence
        simulateFrame(state, userInput, predictedOpponentInput) for the frames we still don't know (back to the frame we started this loop in)
        remove the opponentInputQueue

    opponentUseInput = predict input for opponent predictInput(state)
    useInput = read stored input for user from inputQueue that has waited the hardcoded number of input lag frames
    newState = simulateFrame(state, useInput, opponentInputQueue) // simulates the next frame
  endloop

an input looks like: [frameNumber, [e.keyCode list]] where frameNumber is the id of the frame in which the input was created, so frameNumber + minimumLag = the frame in which the simulation includes that input

the Fight object in meteor is used for the information of who the combatants are so as to be able to PeerJS connect if its a human vs human or to simulate ai if its a human vs monster
fight component loads:
  first thing is to set up peerJS connection to opponent
  show "waiting" message
  have peerJS connection going:
    start the fight by initializing the game simulation in matter-js, rendered with pixi-js

need to answer: what happens when both peers disconnect? (close tabs) I think probably 1x per second the fight state should be updated on the Fight Mongo record to serve as a backup. That way whenever one player disconnects, the game can restart where it was last known by the server without too much hassle/loss. Then if both players disconnect, the fight is on pause indefinitely, until they both connect again. Obviously, fights need a maximum timeout condition, where if the game goes too long without the fight updating, then the player(s) who are disconnected get penalized and the fight is ended. Full loss? seems harsh penalty. Perhaps just half your hp and an energy penalty or something.

=================

a pure fighting game:
    fight -> cutscene -> repeat
lvl 1 fighting RPgame:
    fight -> level up character -> cutscene -> repeat
lvl 2 fighting RPgame:
    fight -> level up character + buy/sell items -> cutscene -> repeat
lvl 3 fighting RPgame:
    wander world -> find monster -> fight -> level up character + buy/sell items -> repeat
lvl 4 RPG fighter:
    just a full RPG but fights are 1v1 fighting game style


RPG elements
  character progression (stats + skill trees)
  equipment
  open world exploration
  expanded commerce (PvP trade, specialized NPC shops, etc)
  non-combat skills
    - crafting
      - smithing
      - alchemy
      - enchanting
    - resource collection
      - wood
      - ore
  guilds/alliances


=======================

3 classes: warrior, wizard, thief
classes map to shoto, zoner, grappler, since the warrior can do both, the wizard likes to keep distance with ranged spells, and the thief likes to get in close and do big damage.
grappling flow-chart system where a grab leads to a throw, leads to an attempted submission or attack, and escape possibilities for the victim at each stage of the flow chart
combo system is not present/implied. there are no target combos or auto combos, everything is just based on what moves you can string together and land
any character can learn any move, however moves in your class are cheaper to learn. moves are learned by spending "skill points." a fixed number of "skill points" are earned per level up
3 bars: health, mana, stamina
  which obviously line up to warrior, wizard, thief in terms of which bar the character has most of relative to the other characters
  health: does not regenerate during fights. when your opponent lands an attack, it decreases. at 0 you die
  mana: regenerates linearly during fights. when you use a magic-based attack, it decreases. If you do not have enough mana for a magic-based move, it whifs
  stamina: regenerates reverse exponentially during fights, meaning that when you have only a tiny bit of bar gone, it comes back very fast, but when you have most of your bar gone, it comes back very slow. Each move (of any kind, attack, magic, grap, or just movement) uses some amount of stamina, except for block, which uses none, but can only be done if you have more than 0 stamina, and stamina does not regenerate while blocking. If you do not have enough stamina for a move you enter "heaving" state which quickly regens stamina, but leave you open for attack

warrior:
  uses a sword (medium range)
  high hp, low mana, medium stamina
  striking moves are cheaper to learn
wizard:
  uses a staff (long range)
  low hp, high mana, medium stamina
  magic moves are cheaper to learn
thief:
  uses a dagger (short range)
  medium hp, medium mana, high stamina
  grappling moves are cheaper to learn

possible moves
movement
  normal l/r
  jump
  crouch
  double jump
  dash (double tap L/R)
  air dash
  vanish/teleport (magic grab)
  ground slide (crouch dash)
  fly (magic jump)
strikes
  light - a stab forward with the sword
  medium - a horizontal slash with the sword
  heavy - a top to bottom swing with the sword
  crouching light
  crouching medium
  launcher (down heavy)
  poke (forward light)
  overhead (forward medium)
  tackle (forward heavy)
  feint light (back light)
  feint medium (back medium)
  feint heavy (back heavy)
  flurry of strikes (quarter-circle light)
  spin (quarter-circle medium)
  execution (quarter-circle heavy) - stabs the sword straight down with two hands
ranged
  firebolt (magic light)
  lightning (magic medium) - a lightning bolt strikes a fixed distance away from the caster the direction he is facing
  ice aura (magic heavy) - a freezing aura briefly surrounds the caster, damaging 
  fireblast (forward magic light) - a column of fire extends in the direction the caster faces for half the distance of the map, continously for some fixed time
  lightning storm (forward magic medium) - ???
  hail spikes (forward magic heavy) - a string of iceicles fall like dominoes out from the caster toward end of map
  trifecta (quarter-circle magic) - ice spike, firebolt, and lightning bolt converge on opponent from upper left corner, upper mid, and upper right corner of screen
  flaming stab (quarter-circle magic+light)
  call lightning (quarter-circle magic+medium)
grapples
  grab
  throw (grapple light)
  sweep (grapple medium)
  pull  (grapple heavy)
  mount (frome throw/sweep, grapple light)
  side control (from throw/sweep, grapple medium)
  back (from pull, grapple heavy)
  ground and pound (from mount/sidecontrol, grapple light)
  armbar (from mount/sidecontrol/back, grapple medium)
  choke (from side control or back, grapple heavy)
misc
  block
  block low

Movement Tree:
  normal l/r
  └── dash
      └── air dash
  jump
  └── double jump
      └── fly (magic jump)
  crouch
  └── ground slide (crouch dash)
      └── vanish/teleport (magic grab)

Striking Tree:
  light
  ├── crouching light
  │   └── forward light
  └── back light
      └── quarter-circle light
  medium
  ├── crouching medium
  │   └── forward medium
  └── back medium
      └── quarter-circle medium
  heavy
  ├── crouching heavy
  │   └── forward heavy (tackle)
  └── back heavy
      └── quarter-circle heavy

Magic Tree:
  firebolt
  └── fireblast (forward)
      ├── quarter-circle magic (requires lighting storm and hail spikes)
      └── quarter-circle magic+light
  lightning
  └── lightning storm (forward)
      ├── quarter-circle magic (requires hail spikes and fireblast)
      └── quarter-circle magic+medium
  ice aura
  └── hail spikes (forward)
      ├── quarter-circle magic (requires lighting storm and fireblast)
      └── quarter-circle magic+heavy

Grappling Tree: (only shows learning path, not routes you can use in combat, since the armbar can be done from all positions)
  grab
  ├── throw
  │   └── side-control
  |       └── armbar
  ├── sweep
  │   └── mount
  │       └── ground and pound
  └── pull
      └── back
          └── choke

Items: all items are class limited

  slots: weapon, head, body
  weapons: dagger, sword, staff
  head: hood, floppy hat, helmet
  body: cloak, robe, gambeson

  Thief
    weapons: pocket knife, iron dagger, steel dagger
    head: beanie, wool hood, leather hood
    body: clothes, wool cloak, leather cloak
  Warrior
    weapons: rusted sword, iron sword, steel sword
    head: wooden helmet, iron helmet, steel helmet
    body: clothes, gambeson, chain mail
  Wizard
    weapons: quarterstaff, gnarled gem staff, fine gem staff
    head: hat, wool wide brim hat, suede wide brim hat
    body: clothes, wool robe, fine robe



=====

Gameloop plan

remoteInputs are updated asynchronously because javascript
fightEngine contains the game state, knows how to render a frame, and knows how to advance a frame, and knows how to rollback to a frame

  1. set up connection
  2. initiate game loop
    3. pass local inputs to GGPO
        a. save to local input buffer
        b. send to remote
    4. get inputs from GGPO for this frame
        check and see if a new remoteInput has come in
          if the new remoteInput does not match the predicted remoteInput for the (past) frame, ROLLBACK
            rollback to the offending frame (load_game_state)
            until we are caught back up,
              call advanceGameState(inputs) with corrected input/new predicted input
            return localInput for this frame and predictedRemoteInput for this frame
          else (the new remoteInput DID match our predictions
            return localInput for this frame and predictedRemoteInput for this frame
        else
          predict remoteInput for this frame
        return localInput for this frame and remoteInput for this frame
    5. advanceGameState(inputs)


==================

wuxia setting is good fit for this game

- collect chi from killing monsters
- cultivate chi to expant your dantian or to attempt to ascend to the next level
- each level up your character gains one open move slot and some stats
- find manuals or try to invent your own moves to fill your character's move slots
- some moves require weapons
- alchemy to create pills requires combining rare ingredients. the game mechanic is hex color addition. Each ingredient has it's own color, and quantity. The more other ingredients there are already in the pot, the less adding your next ingredient will move the color toward the ingredient's color. Additionally, temperature must be controlled, and if it is too hot, the color drifts up and if it is too cold, the color drifts down, more rapidly the more distant temperature is from where it should be. Each recipie for a pill requires getting a pot to a certain color range and holding it there for a certain amount of time. More complex pills may require multiple stages, like get to blue, hold for a while, get to red, hold for a while, etc, which represents an ideal "color path" of correct color over time. The area under the curve difference between the ideal color path and the actual color path taken determines the quality of the pill(s) produced. The quantity of ingredients used determines how many pills are created at once. This system means that multiple ingredient combinations can be used to produce the same pill

