import Peer from 'simple-peer';
import { Fights } from '/imports/api/fights/fights.js';
import { Characters } from '/imports/api/characters/characters.js';
import './hello.html';

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
    console.log("FIGHT",fight);
    const remoteCharacterId = _.find(fight.characters, function(cid){ return cid != character._id});
    
    const isInitiator = fight.characters[0] == character._id;

    if (!instance.peer && fight.fighterCount == 2) {
      instance.peer = new Peer({
        initiator: isInitiator,
        trickle: false,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },{ username: 'pooperson', urls: 'turn:165.22.135.241:3478', credential: 'peepeepoopoogross' }] },
      });

      instance.peer.on('error', err => console.log('error', err));

      instance.peer.on('signal', data => {
        console.log('SIGNAL', JSON.stringify(data));
        if (data.type == 'offer') Meteor.call('fights.offer', fight._id, JSON.stringify(data));
        if (data.type == 'answer') Meteor.call('fights.answer', fight._id, JSON.stringify(data));
      })

      instance.peer.on('connect', ()=>{
        console.log("CONNECTED")
        instance.connected = true;
        //Meteor.call('fights.connected', fight._id);
      })
      instance.peer.on('data', data => {
        console.log('data: '+data);
        $('#messages').append("<p>THEM: "+data+"</p>");
      })
    }

    if (instance.peer && !isInitiator && fight.offer && !instance.connected) {
      instance.peer.signal(JSON.parse(fight.offer))
      Meteor.call('fights.usedOffer', fight._id);
    }
    if (instance.peer && isInitiator && fight.answer && !instance.connected) {
      instance.peer.signal(JSON.parse(fight.answer))
      Meteor.call('fights.usedAnswer', fight._id);
    }

  })
});


Template.hello.helpers({
});

Template.hello.events({
  'click button#send'(event, instance) {
    instance.peer.send($('#message').val())
    $('#messages').append("<p>ME: "+$('#message').val()+"</p>");
    $('#message').val('');
  },
});
