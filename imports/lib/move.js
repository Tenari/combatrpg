// the move class represents some ability that an entity can perform in its `act` fn if the correct inputHistory is there
// it is abstracted from the Entity class since different Entities have different movesets, especially with the planned RPG features that allow customizable moves sets for characters
// a move `definition` is an object indicating the conditions an inputHistory must meet to qualify:
/* {
     cancelable: boolean,
     // each stage represents an input or combination of inputs that must be present
     // if all stages are matched sequentially, then the move is triggered
     // stages[0] is the final stage that must be inputted, stages[length-1] is the first stage that must be inputted
     stages: [
       {
         inputs: [list of input keys that must be simeltaneously present to trigger the stage]
         errorInputs: [list of input keys that break the stage if present]
         link: number, // the max number of frames that can pass from the previous stage to this one. first stage always should have link of 1.
       }
     ],
     blockingConditions: [list of conditions (like hitStun or dashing) that cannot be true when the move finishes],
     effect: {
       damage: number,
       pushback: number,
       block: 'high|low' | undefined,
       velocity: number, // change your velocity to this number if velocity is defined
       frames: [
         {
           sprite: name,
           hitboxes: [{x,y,width,height}], //relative to the entity's origin (x,y)
           hurtboxes: [{x,y,width,height}], //relative to the entity's origin (x,y)
           pushbox: {x,y,width,height}, //relative to the entity's origin (x,y)
         }
       ],
     }
   }
*/
//var _ = require('underscore');
import * as Matter from 'matter-js';

export function Move(definition) {
  this.cancelable = definition.cancelable || false; //default not a cancelable move
  // returns `true` if inputHistory matches the definition object for this move, `false` otherwise
  //   expects inputHistory[0] to be current frame, [1] to be previous frame, etc
  //   expects state to be the character state object containing statuses like {hitStun: true, dashing: false} etc
  this.matchesInput = function(inputHistory, state) {
    // detect blockingConditions
    if (_.find(definition.blockingConditions, function(condition){return state[condition] == true;})) return false;
    
    let allStagesPassed = false;
    let lastMatched = -1;
    for (let stageIndex = 0; stageIndex < definition.stages.length; stageIndex += 1) {
      let stage = definition.stages[stageIndex];
      let currentFrame = lastMatched+1;
      let stagePassed = false;
      // from the currentFrame, to the limit of the stage's link, iterate to try to find a match
      for (let inputIndex = currentFrame; inputIndex < currentFrame+stage.link; inputIndex += 1) {
        if (stagePassed) continue;
        let currentInput = inputHistory[inputIndex];
        if (_.find(stage.errorInputs, function(key){ return currentInput[key];})) {
          return false;
        }

        if (_.all(stage.inputs, function(key){ return currentInput[key]; })) { // if all stage inputs are matched, stage is passed
          lastMatched = inputIndex;
          stagePassed = true;
          break;
        }
      }
      if (!stagePassed) return false;
      if (stageIndex == definition.stages.length -1 && stagePassed) {
        return true;
      }
    }
  }

  // SIDE EFFECTS!!! This is the method that does the move on the Entity. Handles changing sprite frame, velocity, hitboxes+hurtboxes+pushboxes
  this.perform = function(entity){
    console.log(definition.key);
    const nextFrame = entity.state.moveFrame + 1;
    const newFrame = definition.effects.frames[nextFrame];
    if (!newFrame) {
      return this.finish(entity);
    }
    if (definition.effects.velocity) {
      Matter.Body.setVelocity(entity.body, Matter.Vector.create(definition.effects.velocity, entity.body.velocity.y));
    }
    if (definition.effects.vertical) {
      Matter.Body.setVelocity(entity.body, Matter.Vector.create(entity.body.velocity.x, definition.effects.vertical));
    }
    if (_.isObject(newFrame) && newFrame.spriteName && newFrame.spriteNumber) {
      entity.setSprites(newFrame.spriteName, newFrame.spriteNumber);
    }
    // do stuff
    return entity.state.moveFrame = nextFrame;
  }

  this.finish = function(entity){
    entity.state.move = null;
    entity.state.moveFrame = null;
    entity.setSprite(entity.idleSprites[0]);
  }
}

/*
let definition = { // dash right (D key)
  stages: [
    {
      inputs: [65],
      errorInputs: [68],
      link: 1,
    },
    {
      inputs: [],
      errorInputs: [65, 68],
      link: 1,
    },
    {
      inputs: [65],
      errorInputs: [68],
      link: 8,
    },
  ],
  blockingConditions: [],
  effects: {
    velocity: 9,
  }
}
let history = [{65:true},{},{},{},{65:true},{65:true}];
let history2 = [{65:true},{},{68:true},{},{65:true},{65:true}];
let history3 = [{65:true, 68:true},{},{},{},{65:true},{65:true}];
let history4 = [{65:true},{65:true},{},{},{}];
var m = new Move(definition);
console.log(m.matchesInput(history, {}))
console.log('---')
console.log(m.matchesInput(history2, {}))
console.log('---')
console.log(m.matchesInput(history3, {}))
console.log('---')
console.log(m.matchesInput(history4, {}))
*/
