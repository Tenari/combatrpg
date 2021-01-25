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

You progress by gaining chi. Once you have a lot of chi, you can either expand your "dantian" (where you store your chi) or level up. Expanding your dantian means you can use more chi when you level up, which gives you stat benefits. You can expand your dantian multiple times between levels. After levelling up, you lose all your chi and must begin collecting again. You gain chi automatically over time, but the rate is influenced by the "feng shui" of the place you are at, and the population density of the area. Beautiful remote places have a much higher chi regen rate than ugly crowded places. You also gain a lot of chi from killing monsters and absorbing their chi. There are some magical pills you can take as well that give you chi. Levelling up improves your character by giving you more hp and by allowing you to learn new combat techniques.

However, as stated before, killing monsters and absorbing their chi is the main way to gain chi. However, to prevent the game from being a chi-grindfest, we want to scale the chi you earn logarithmically by how powerful the monster is. Basically, it only takes killing about three things on your level to get enough chi to level up, whereas it would take like 30 things a level below you, or 300 things 2 levels below, and killing stuff 3 levels down gives you basically nothing. And if you kill something a level above you, you'd potentially get enough chi to level up more than once.

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

### World

The world is an ancient china fantasy setting with lots of wilderness and secluded meditation locations. There are cities as well but players will likely not spend a whole ton of time there as the valuable stuff is out in the wild, and they gain chi more slowly in cities. but cities are a good place to trade stuff and find sparring partners etc. The wilderness has dungeon-like cave systems and dangerous forests and difficult to access mountains and hidden lakes and stuff. Designing an attractive and "vast" feeling landscape will be important to making the game fun.

#### World interactions

World vs NPCs

The human NPCs are mostly found in cities and are mostly fairly weak. However, killing them causes guards to hunt you, and they are fairly strong. There are some dangerous human NPCs out in the wilderness though, usually secluded for cultivation, and not pleased to be interrupted. Then there are monsters, found in the wild. The more dangerous ones are generally found deeper in the wilderness, or in dungeons.

World vs Loot

Pills and pill refining, as well as weapon/armor smithing requires rare ingredients. These ingredients can be found out in the wild, or occasionally purchased in cities.

### NPCs

There are humans and monsters. You can talk to humans, but not to monsters. Killing monsters gives you lots of chi. Killing humans makes other humans try to kill you. Human npcs can trade and teach you things. They are mostly in cities. Monsters are mostly in the wild. Monster parts are often necessary ingredients in magical pills.

### Loot

The main things your character wants are magical pills and weapons/armor and instruction manuals.

Magic pills are consumables and give buffs or chi boosts. Pills can be created by players from Ingredients. Ingredients are things like rare lotus flowers or magical serpent skin.

Weapons change what moves you have access to if you equip them, so usually you spec into a specific weapon type (like sword) so you only need to learn sword moves. Weapons are expensive but generally give you a benefit in combat as compared to weapon-less attacks. Weapons degrade and can break, though, so choosing to use a weapon is not a free benefit.

Armor slows you down, but makes you live longer. Some clothes are enchanted to act as armor and give only the good effects without slowing you down. Of course these are expensive.

Instruction manuals teach you moves to use in combat.

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

I am blending tropes for this setting after having consumed the following media. You dont need to watch/read all of them but you should probably be slightly familiar to get how these sorts of worlds usually work. The fiction books on this list are quick reads and pretty entertaining.

- [Handsome Siblings](https://netflix.com/title/80996973)
- [Scissor Seven](https://netflix.com/title/81156880)
- [A Thousand Li](https://b-ok.cc/book/5249175/b07b45)
- [Power Buryoku](https://b-ok.cc/book/11366672/1b2d5e)

## Monetization

I wanna keep it simple. You can make an account/character for free. You can play for free until your character dies, or is deleted for inactivity (90 days no log in). Once your character dies, you can either pay a nominal fee of like $0.75 to revive once more, or you can just buy the game forever for $20 or something reasonable like that and be able to revive for free every time you die. Once a character has had any money invested in it, it will not be deleted for inactivity.
