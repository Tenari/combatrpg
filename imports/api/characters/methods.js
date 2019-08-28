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
    if (fight) {
      Fights.update(fight._id, {$push: {elements: {type: 'character', id: cid, x: 300, y: 300}, characters: cid}, $inc: {fighterCount: 1}})
    } else {
      Fights.insert({
        fighterCount: 1,
        characters: [cid],
        elements: [{type: 'character', id: cid, x:50, y:300}, {type: 'floor', height: 40}],
      })
    }
    return cid;
  },
});
