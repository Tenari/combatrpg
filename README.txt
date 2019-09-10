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
- using a skill makes you better at that skill
- can attack other players
- death => lose all skill, gold, items
- weekly tournament crowns winner on leaderboard, gives gold, everyone else dies
- world consists of 1 town, surrounded by wilderness in all directions, which gets progressively more deadly
- energy mechanic/APs
- gear consists of armor and sword + sword or sword + shield
- use gold to buy/repair gear

v 0.01 = can walk around in the overworld (tiny map, 1 squirrel enemy)
v 0.02 = can enter fight mode
v 0.03 = can fight + die
v 0.04 = character management view/menus
v 0.05 = can get $ + xp
v 0.06 = using skills in combat makes you better at that skill

COMBAT

sword
  stab
    slash
     stab-slash combo
    overhand
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
