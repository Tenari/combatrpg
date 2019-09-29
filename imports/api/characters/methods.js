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
    };
    if (fight) {
      Fights.update(fight._id, {$push: {entities: character, characters: cid}, $inc: {fighterCount: 1}})
    } else {
      Fights.insert({
        fighterCount: 1,
        characters: [cid],
        entities: [character],
        lastTick: Date.now(),
      })
    }
    return cid;
  },
});
