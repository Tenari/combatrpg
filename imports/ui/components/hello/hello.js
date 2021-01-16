import Peer from 'simple-peer';
import { Fights } from '/imports/api/fights/fights.js';
import { Characters } from '/imports/api/characters/characters.js';
import './hello.html';

function setupPeer(fight, character) {
  console.log('settingup peer');
  var peer = new Peer({
    initiator: fight.characters[0] == character._id,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },{ username: 'pooperson', urls: 'turn:165.22.135.241:3478', credential: 'peepeepoopoogross' }] },
  })
  peer.on('error', err => console.log('error', err));
  peer.on('connect', ()=>{
    console.log("CONNECT")
    peer.send('poop '+ Math.random());
  })
  peer.on('data', data => {
    console.log('data: ', data);
  })

  peer.on('signal', data => {
    console.log('SIGNAL', JSON.stringify(data));
    if (data.type == 'offer') Meteor.call('fights.signal', fight._id, JSON.stringify(data));
    if (data.type == 'answer') Meteor.call('fights.answer', fight._id, JSON.stringify(data));
  })
  //peer.signal(JSON.parse(fight.signal))

  return peer;
}

Template.hello.onCreated(function helloOnCreated() {
  this.subscribe('fights.all');
  this.autorun( () => {
    var instance = this;
    const character = Characters.findOne({userId: Meteor.userId()});
    instance.character = character;
    if (!character) return false;

    instance.fight = Fights.findOne({characters: character._id});
    const fight = instance.fight;
    if (!fight) return false;
    const remoteCharacterId = _.find(fight.characters, function(cid){ return cid != character._id});

    if (!this.peer) {
      instance.peer = setupPeer(fight, character);
    }

  })
});


Template.hello.helpers({
});

Template.hello.events({
  'click button#offer'(event, instance) {
    instance.peer.signal(JSON.parse(instance.fight.signal))
  },
  'click button#answer'(event, instance) {
    instance.peer.signal(JSON.parse(instance.fight.answer))
  },
  'click button#send'(event, instance) {
    instance.peer.send('fuckyou')
  },
});
