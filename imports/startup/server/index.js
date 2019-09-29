// Import server startup through a single index entry point

import './fixtures.js';
import './register-api.js';

import { Fights } from '/imports/api/fights/fights.js';
import { animations } from '/imports/config/animation.js';
import PNG from 'pngjs';
let png = PNG.PNG;
import fs from 'fs';


/*
example of reading a png
fs.createReadStream(Assets.absoluteFilePath('stand_sprites.png'))
    .pipe(new png())
    .on('parsed', function() {
      for (var y = 0; y < this.height; y++) {
          for (var x = 0; x < this.width; x++) {
              var idx = (this.width * y + x) << 2;
              console.log(idx, this.data[idx], this.data[idx+1], this.data[idx+2], this.data[idx+3]);
          }
      }
    });

Meteor.setInterval(function(){
  Fights.find({}).forEach(function(fight){
    console.log('tick '+fight._id);
    const lastTick = fight.lastTick || Date.now();
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    const floor = _.find(fight.elements, function(elem){return elem.type === 'floor'});
    let characters = _.select(fight.elements, function(elem){return elem.type === 'character'});
    const floorHeight = 600 - floor.height;
    characters.forEach(function(character){
      const animFrame = {
        x:      animations[character.animation][character.frameIndex],
        y:      animations[character.animation][character.frameIndex + 1],
        width:  animations[character.animation][character.frameIndex + 2],
        height: animations[character.animation][character.frameIndex + 3],
      };
      let border = []; // list of {x,y} that trace the outline/hitbox
      fs.createReadStream(Assets.absoluteFilePath('stand_sprites.png'))
        .pipe(new png())
        .on('parsed', function() {
          for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
              if (x > animFrame.x && x < animFrame.x+animFrame.width && 
                  y > animFrame.y && y < animFrame.y+animFrame.height) {
                var idx = (this.width * y + x) << 2;
                if (this.data[idx] != 0 || this.data[idx+1] != 0 || this.data[idx+2] != 0 || this.data[idx+3] != 0) {
                  border.push({x,y});
                }
              }
            }
          }
        });

      // apply gravity

    })

    fight.lastTick = now;
    Fights.update(fight._id, fight);
  })
},1000)

*/
