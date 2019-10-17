export const BUTTONS = {
  left: 68,
  right: 65,
  jump: 32,
  down: 83,
};
export const MOVES = {
  dash_right: {
    stages: [
      {
        inputs: [BUTTONS.right],
        errorInputs: [BUTTONS.left],
        link: 1,
      },
      { // then you must press right again
        inputs: [],
        errorInputs: [BUTTONS.left, BUTTONS.right],
        link: 1,
      },
      { // first press right, then you have 20 frames to not be pressing either right or left
        inputs: [BUTTONS.right],
        errorInputs: [BUTTONS.left],
        link: 20,
      },
    ],
    blockingConditions: [],
    effects: {
      velocity: -9,
      frames:[1,2,3,4,5,6],
    }
  },
  dash_left: {
    stages: [
      {
        inputs: [BUTTONS.left],
        errorInputs: [BUTTONS.right],
        link: 1,
      },
      { // then you must press right again
        inputs: [],
        errorInputs: [BUTTONS.left, BUTTONS.right],
        link: 1,
      },
      { // first press right, then you have 20 frames to not be pressing either right or left
        inputs: [BUTTONS.left],
        errorInputs: [BUTTONS.right],
        link: 20,
      },
    ],
    blockingConditions: [],
    effects: {
      velocity: 9,
      frames:[1,2,3,4,5,6],
    }
  },
  right: {
    stages: [{inputs:[BUTTONS.right],errorInputs:[BUTTONS.left],link:1}],
    blockingConditions: [],
    effects: {
      velocity: -3,
      frames: [{}],
    }
  },
  left: {
    stages: [{inputs:[BUTTONS.left],errorInputs:[BUTTONS.right],link:1}],
    blockingConditions: [],
    effects: {
      velocity: 3,
      frames: [{}],
    }
  },
}
