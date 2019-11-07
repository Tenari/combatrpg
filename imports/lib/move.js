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
  this.key = definition.key;
  this.cancelable = definition.cancelable || false; //default not a cancelable move

  // returns false if the input is an invalid transition from state
  // returns the next state if input is a valid transition
  this.next = function(state, input){
    let stage = definition.stages[state.index];
    if (!stage) return false;

    // if ANY errorInput is currently being pressed, this is an invalid transition, return false
    if (_.find(stage.errorInputs, function(key){ return input[key]; })) return false;

    // if ALL the required inputs are currently being pressed, move to the next stage
    if (_.all(stage.inputs,function(key){return input[key];})) {
      return {
        index: state.index+1,
        waits: 0,
      };
    }

    // if neither of the above condition is true, we are in a 'neutral' input state

    // if we have been waiting longer than the move allows, return false
    if (state.waits >= stage.link) return false;

    // nothing else matches, so just increase the waits
    return {
      index: state.index,
      waits: state.waits + 1,
    }
  }

  this.inputChainIsComplete = function(state) {
    return state.index+1 > definition.stages.length;
  }
  // SIDE EFFECTS!!! This is the method that does the move on the Entity. Handles changing sprite frame, velocity, hitboxes+hurtboxes+pushboxes
  this.perform = function(entity){
    const nextFrame = entity.state.moveFrame + 1;
    const newFrame = definition.effects.frames[nextFrame];
    if (!newFrame) {
      return this.finish(entity);
    }
    console.log(definition.key);
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
