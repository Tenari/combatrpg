# Premise

Combine a pokemon-style traditional RPG with Smash Melee fighting-game combat mechanics, put it in a [wuxia](https://netflix.com/title/80996973) setting, and make it a multiplayer online game.

## Multiplayer

Played through the browser, Meteor gives us an auto-updating client-side database of relevant objects so that the movements of other players around the map, or results of fights like dropped items, lost health, etc, are instantly visible in realtime via mini-mongo. See Meteor Docs for details.

Using [simple-peer](https://github.com/feross/simple-peer) and a [turnserver](https://github.com/Tenari/combatrpg/blob/master/turnserversetup.txt) and a javascript implementation of GGPO rollback netcode, we will be able to make the fighting-game aspect of combat feel pretty close to the feel of playing melee with your bros.

## RPG

The core components of a multiplayer RPG are: Character, World, NPCs, Loot, and the interactions between them.

### Character

You get to create a character for free, with a valid email address. Your character is a martial artist trying to [cultivate](https://martial-world.fandom.com/wiki/Cultivation). This is the staple trope/setting of all wuxia. Your character starts out not knowing very many moves, and as he gains chi/exp he unlocks new moves he can use in combat. The core character progression loop is centered around the fighting game. Essentially you are building your own custom fighting game character over time as you advance through the RPG aspects of the game. This is good in two ways:

1. it helps encourage players who think fighting games are hard, since the initial character is very very simple and the "overload of information" problem many fighting games have is avoided
2. it makes RPG level ups/progression have a more "real" reward than just a higher lvl number and bigger health bar. Leveling up out of combat/getting better loot/making your character better in other ways actually gives you more options *in combat*. Which is generally better. Fox is the best character in Melee, because in any given situation, he has the most options of any character.

Your character's stats: (incomplete)

- name
- gender
- weight
- size
- fall-speed
- Health Points
- Chi (energy)
- crafting skills?
- items/money (inventory)
- location

You progress by gaining chi. Once you have a lot of chi, you can attempt to push through to the next level. Your level up attempt's success chance increases the more chi you have stored. After levelling up, you lose all your chi and must begin collecting again. You gain chi automatically over time, but the rate is influenced by the "feng shui" of the place you are at, and the population density of the area. Beautiful remote places have a much higher chi regen rate than ugly crowded places. You also gain a lot of chi from killing monsters and absorbing their chi. There are some magical pills you can take as well that give you chi. Levelling up improves your character by giving you more hp and by allowing you to learn new combat techniques.

#### Character Interactions

Character vs Character:

- fight other players
- trade items/money with other players
- form "clans" or "schools" with other players (alliance/guild system)
- chat with other players
- steal from other players?
- teach combat techniques to other players

Character vs World:

You exist at a given location in the world. You move around in a traditional 2.5D top-down pokemon red/blue style RPG tiled way. You can enter rooms/buildings. You can interact with things in the world like trees (by cutting them down) or flowers (by picking them) etc.

Character vs NPCs

- fight
- trade items/money with human ones
- get quests from human ones
- absorb chi from killing monster ones
- get items/resources/pill ingredients from killing monster ones
- learn combat techniques from trainers

Character vs Loot

- wear items to boost various combat stats/change techniques(sword vs fist style combat etc)
- consume pills to heal/gain chi/get temporary boosts to stats etc
- learn combat techniques from instruction manuals

## Combat

Smash Melee combat using the Smash Utimate "Stamina" victory condition mode, and using stages where there are no infinite pits to fall off.

Weapons give greater range on hitboxes, but tend to have more endlag on whiffed moves. Weapons also deteriorate to act as a money sink in the game's economy.

Control scheme:

- directional axis (mappable to WASD and modifiers for angles, or controller)
- jump button
- defense button
- grab button
- light attack button
- heavy attack button
- special attack button
- attack stick (c-stick) for either light or heavy directional attacks

Moves:

Movement

- walk (tilt directional axis)
- dash
- jump
- double jump(s)
- crouch

Attacks

- grab
- jab (neutral light attack)
- forward light attack
- downward light attack
- up light attack
- neutral heavy attack
- forward heavy attack
- downward heavy attack
- up heavy attack
- neutral special attack
- forward special attack
- downward special attack
- up special attack
- neutral air attack (light or heavy can be learned, but only one "equipped")
- forward air attack (light or heavy can be learned, but only one "equipped")
- backward air attack (light or heavy can be learned, but only one "equipped")
- downward air attack (light or heavy can be learned, but only one "equipped")
- upward air attack (light or heavy can be learned, but only one "equipped")

Defense

- block
- spot dodge
- roll dodge
- air dodge
- techs
- directional influence

## Wuxia

