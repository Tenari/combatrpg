export const BUTTONS = {
  right: 68, // D
  left: 65,// A
  jump: 32, // space
  down: 83, // S

  light: 80,    // P
  medium: 219,  // [
  heavy: 221,   // ]
  grab: 220,    // \
  magic: 190,   // .
};
export const MOVES = {
  light_attack: {
    key: 'light_attack',
    stages: [
      {
        inputs: [BUTTONS.light],
        errorInputs: [], // directional/crouching/aerial light_attack are different from light_attack, and will be higher priority. dont exclude the directional buttons here though, or people who dont know the other attacks will not be able to attack while moving which will feel bad
        link: 1,
      },
    ],
    blockingConditions: [],
    effects: {
      frames:[
        {spriteName: 'barb', spriteNumber: '0001'},
        {spriteName: 'barb', spriteNumber: '0001'},
        {spriteName: 'barb', spriteNumber: '0002'},
        {spriteName: 'barb', spriteNumber: '0002'},
        {spriteName: 'barb', spriteNumber: '0002'},
        {spriteName: 'barb', spriteNumber: '0002'},
        {spriteName: 'barb', spriteNumber: '0001'},
        {spriteName: 'barb', spriteNumber: '0001'},
      ],
    }
  },
  dash_right: {
    key: 'dash_right',
    stages: [
      { // first press right
        inputs: [BUTTONS.right],
        errorInputs: [BUTTONS.left],
        link: 1,
      },
      { // then go any number of frames between 1 and 20 without pressing a direction
        inputs: [],
        errorInputs: [BUTTONS.left, BUTTONS.right],
        link: 20,
      },
      { // then press right again
        inputs: [BUTTONS.right],
        errorInputs: [BUTTONS.left],
        link: 1,
      },
    ],
    blockingConditions: [],
    effects: {
      velocity: 9,
      frames:[1,2,3,4,5,6],
    }
  },
  dash_left: {
    key: 'dash_left',
    stages: [
      {
        inputs: [BUTTONS.left],
        errorInputs: [BUTTONS.right],
        link: 1,
      },
      {
        inputs: [],
        errorInputs: [BUTTONS.left, BUTTONS.right],
        link: 20,
      },
      {
        inputs: [BUTTONS.left],
        errorInputs: [BUTTONS.right],
        link: 1,
      },
    ],
    blockingConditions: [],
    effects: {
      velocity: -9,
      frames:[1,2,3,4,5,6],
    }
  },
  jump: {
    key: 'jump',
    stages: [{inputs:[BUTTONS.jump],errorInputs:[BUTTONS.down],link:1}],
    blockingConditions: [],
    effects: {
      vertical: -9,
      frames: [1,2,3,4,5,6,7,8,9],
    }
  },
  right: {
    key: 'right',
    stages: [{inputs:[BUTTONS.right],errorInputs:[BUTTONS.left],link:1}],
    blockingConditions: [],
    cancelable: true,
    effects: {
      velocity: 3,
      frames: [{}],
    }
  },
  left: {
    key: 'left',
    stages: [{inputs:[BUTTONS.left],errorInputs:[BUTTONS.right],link:1}],
    blockingConditions: [],
    cancelable: true,
    effects: {
      velocity: -3,
      frames: [{}],
    }
  },
}
