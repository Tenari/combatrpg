import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Characters } from './characters.js';
import { Fights } from '/imports/api/fights/fights.js';

Meteor.methods({
  'characters.insert'() {
    const cid = Characters.insert({
      userId: Meteor.userId(),
      createdAt: new Date(),
    });
    const fight = Fights.findOne({fighterCount: 1})
    const character = {
      type: 'character', id: cid,
      x: 300, y: 300, height: 192, width: 192,
      velocity: {x: 0, y:0},
      animation: 'idle', frameIndex: 0, src: 'stand_sprites.png'
    };
    if (fight) {
      Fights.update(fight._id, {$push: {elements: character, characters: cid}, $inc: {fighterCount: 1}})
    } else {
      Fights.insert({
        fighterCount: 1,
        characters: [cid],
        elements: [character, {type: 'floor', height: 40}],
        lastTick: Date.now(),
      })
    }
    return cid;
  },
});
