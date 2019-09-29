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
