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
    let character = {
      type: 'character', id: cid,
      x: 100, y: 422, height: 192, width: 192,
    };
    if (fight) {
      character.x = 400;
      Fights.update(fight._id, {$push: {entities: character, characters: cid}, $inc: {fighterCount: 1}})
    } else {
      Fights.insert({
        fighterCount: 1,
        characters: [cid],
        entities: [{x:-200, y:650, height: 200, width: 2000, type: 'ground', matterOptions: {isStatic: true}},character],
        lastTick: Date.now(),
      })
    }
    return cid;
  },
});
