// peer to peer networking for js based fighting games utilizing PeerJS
export function Network(ggpo, options) {
  options = options || {};
  // CONSTANTS
  var INPUT_HISTORY_SIZE = options.INPUT_HISTORY_SIZE || 50;  // The size of the input history buffer. Must be atleast 1
  var SEND_DELAY_FRAMES = 0;          // Delay sending packets when this value is greater than 0. Set on both clients to not have one ended latency.
  var SEND_HISTORY_SIZE = options.SEND_HISTORY_SIZE || 5;          // The number of inputs we send from the input history buffer. Must be atleast 1.

  // VARIABLES
  this.enabled = false;               // set to true when the network is running
  this.connectedToClient = false;     // true when the handshake has happened and we are connected to the opponent
  this.isServer = false;              // duh
  this.connection = null;             // the PeerJS object for the connection
  this.confirmedTick = 0;             // The confirmed tick indicates up to what game frame we have the inputs for.
  this.latency = 0;                   // Keeps track of the latency.
  this.toSendPackets = [];            // Packets that have been queued for sending later. Used to test network latency.

  var msgCode = {
    handshake: 1,
    playerInput: 2,
    ping: 3,
    pong: 4,
    sync: 5,
  }

  // Setup a network connection and connect to the server.
  this.startConnection = function() {
    this.enabled = true;
    this.isServer = false;

    // Start the connection with the server
    this.handshakeConnect();
  }
  // Connects to the other player who is hosting as the server.
  // This must be called to connect with the server.
  this.handshakeConnect = function() {
    this.sendPacket(this.makeHandshakePacket(), 5);
  }

  // Setup a network connection as the server then wait for a client to connect.
  this.startServer = function() {
    this.enabled = true;
    this.isServer = true;

    this.handshakeConnect();
  }

  // Handles sending packets to the other client. Set duplicates to something > 0 to send more than once.
  this.sendPacket = function(packet, duplicates) {
    if (!duplicates) duplicates = 1;

    var that = this;
    _.times(duplicates, function() {
      if (SEND_DELAY_FRAMES > 0) {
        that.sendPacketWithDelay(packet);
      } else {
        that.sendPacketRaw(packet);
      }
    })
  }
  // Queues a packet to be sent later
  this.sendPacketWithDelay = function(packet) {
    let delayedPacket = {packet:packet, time: (new Date().getTime())};
    this.toSendPackets.push(delayedPacket);
  }
  // Send a packet immediately
  this.sendPacketRaw = function(packet) {
    this.connection.send(JSON.stringify(packet));
  }

  // Send all packets which have been queued and who's delay time has elapsed.
  this.processDelayedPackets = function() {
    let newPacketList = [];  // List of packets that haven't been sent yet.
    let timeInterval = (SEND_DELAY_FRAMES*20); // How much time must pass (converting from frames into ms)

    var that = this;
    _.each(this.toSendPackets, function(data, index){
      if (((new Date().getTime()) - data.time) > timeInterval) {
        that.sendPacketRaw(data.packet);  // Send packet when enough time as passed.
      } else {
        newPacketList.push(data);         // Keep the packet if the not enough time as passed.
      }
    })
    this.toSendPackets = newPacketList;
  }

  // the function that the peerJS connection.on('data') should run when data from the peer comes in
  this.receiveData = function(data) {
    data = JSON.parse(data);
    //console.log(data);
    if (!this.enabled) return false;

    const code = data.code;

    // Handshake code must be received by both game instances before a match can begin.
    if (code == msgCode.handshake) {
      if(!this.connectedToClient) {
        this.connectedToClient = true;

        console.log("Received Handshake.")
        // Send handshake to client.
        this.sendPacket(this.makeHandshakePacket(), 5);
      }
    } else if (code == msgCode.playerInput) {
      const receivedTick = data.tick;
      // dont bother if this packet is old
      if (receivedTick > ggpo.lastRemoteInputReceivedAt) {
        console.log(data.inputs);
        // data.inputs is an array of encoded inputState numbers starting with the receivedTick and progressing back in time
        _.each(data.inputs, function(inputNumber, index){
          ggpo.addRemoteInput(receivedTick-index, inputNumber); // update our record of the remote's inputs
        })
      }
//      console.log(`Received Tick: ${receivedTick},  Input: ${this.remoteInputHistory[this.confirmedTick % INPUT_HISTORY_SIZE]}`)
    } else if (code == msgCode.ping) {
      this.sendPacket(this.makePongPacket(data.time));
    } else if (code == msgCode.pong) {
      this.latency = (new Date().getTime()) - data.time;
    } else if (code == msgCode.sync) {
      // TODO make this work with ggpo
      // Ignore any tick that isn't more recent than the last sync data
      if (this.isStateDesynced && tick > this.remoteSyncDataTick) {
        this.remoteSyncDataTick = data.tick;
        this.remoteSyncData = data.syncData;

        // Check for a desync
        this.desyncCheck();
      }
    }
  }

  // Generate a packet containing information about player input.
  this.makeInputPacket = function(data, id, tick) {
    // data.inputs is an array of encoded inputState numbers starting with the receivedTick and progressing back in time
    let history = [];
    for (let i=0; i < SEND_HISTORY_SIZE; i+=1) {
      history[i] = data[id][(tick - i) % INPUT_HISTORY_SIZE];
    }

    return {
      code: msgCode.playerInput,
      id: id,
      tick: tick,
      inputs: history,
    }
    return data;
  }

  // Send a ping message in order to test network latency
  this.sendPingMessage = function() {
    this.sendPacket(this.makePingPacket(new Date().getTime()));
  }
  // Make a ping packet
  this.makePingPacket = function(time) {
    return {code: msgCode.ping, time: time};
  }
  // Make pong packet
  this.makePongPacket = function(time) {
    return {code:msgCode.pong, time: time};
  }
  // Sends sync data
  this.sendSyncData = function() {
    this.sendPacket(this.makeSyncDataPacket(this.localSyncDataTick, this.localSyncData), 5);
  }
  // Make a sync data packet
  this.makeSyncDataPacket = function(tick, syncData) {
    return {code: msgCode.sync, tick, syncData};
  }
  // Generate handshake packet for connecting with another client.
  this.makeHandshakePacket = function() {
    return {code: msgCode.handshake};
  }

  this.sendInputPacket = function(history, id, tick){
    this.sendPacket(this.makeInputPacket(history, id, tick));
  }
}
