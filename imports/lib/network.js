// peer to peer networking for js based fighting games utilizing PeerJS
export function Network(options) {
  options = options || {};
  // CONSTANTS
  this.INPUT_DELAY = options.inputDelay || 3;               // This must be set to a value of 1 or higher.
  var INPUT_HISTORY_SIZE = options.inputHistorySize || 50;  // The size of the input history buffer. Must be atleast 1
  var SEND_DELAY_FRAMES = 5;          // Delay sending packets when this value is greater than 0. Set on both clients to not have one ended latency.
  var SEND_HISTORY_SIZE = 5;          // The number of inputs we send from the input history buffer. Must be atleast 1.
  this.ROLLBACK_MAX_FRAMES = 8;       // The maximum number of frames we allow the game run forward without a confirmed frame from the opponent

  // VARIABLES
  this.enabled = false;               // set to true when the network is running
  this.connectedToClient = false;     // true when the handshake has happened and we are connected to the opponent
  this.isServer = false;              // duh
  this.connection = null;             // the PeerJS object for the connection
  this.confirmedTick = 0;             // The confirmed tick indicates up to what game frame we have the inputs for.
	this.inputState = null;             // Current input state sent over the network
  this.inputHistory = [];             // The input history for the local player. Stored as bit flag encoded input states.
  this.remoteInputHistory = [];       // The input history for the remote player. Stored as bit flag encoded input states.
  this.inputHistoryIndex = 0;         // Current index in history buffer.
  this.syncDataHistoryLocal = [];     // Keeps track of the sync data for the local client
  this.syncDataHistoryRemote = [];    // Keeps track of the sync data for the remote client
  this.syncDataTicks = [];            // Keeps track of the tick for each sync data index
  this.latency = 0;                   // Keeps track of the latency.
  this.toSendPackets = [];            // Packets that have been queued for sending later. Used to test network latency.
  this.lastSyncedTick = 0;           // Indicates the last game tick that was confirmed to be in sync.
  this.localTickDelta = 0;            // last local tick - this.confirmedTick
  this.remoteTickDelta = 0;           // the remote's localTickDelta (the remote's difference between current tick and most recent known input tick)
  this.desyncCheckRate = 20;          // The rate at which we check for state desyncs.
  this.localSyncData = null;          // Latest local data for state desync checking.
  this.remoteSyncData = null;         // Latest remote data for state desync checking.
  this.localSyncDataTick = -1;        // Tick for the latest local desync data.
  this.remoteSyncDataTick = -1;       // Tick for the latest remote desync data.
  this.isStateDesynced = false;       // Set to true once a game state desync is detected.

  var msgCode = {
    handshake: 1,
    playerInput: 2,
    ping: 3,
    pong: 4,
    sync: 5,
  }

  // Input encoding + decoding
  var INPUT_CODES = {}; // map of keyCode to binary flag value
  // defaults to recognizing WASD keyCodes
  _.each(options.recognizedInputs || [87,65,83,68], function(code, index){
    INPUT_CODES[code] = 2 ** index; // 2 ^ index for binary increasing
  })
  // Encodes the player input state into a compact form for network transmission.
  this.encodeInput = function(inputs) { // inputs is an object of {keyCode : boolean}
    // the basic idea is to just send one number over the network representing the entire input state
    var state = 0;
    _.each(inputs, function(down, keyCode) {
      if (down && INPUT_CODES[keyCode])
        state = state | INPUT_CODES[keyCode];
    })
    return state;
  }
  // takes a single state number and translates it into an object of {keyCode : boolean}
  this.decodeInput = function(state) {
    var inputs = {};
    _.each(INPUT_CODES, function(binary, code) {
      if (state & binary) inputs[code] = true;
    })
    return inputs;
  }

  // Setup a network connection and connect to the server.
  this.startConnection = function() {
    console.log("Starting Network")

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
    console.log("Starting Server")

    this.enabled = true;
    this.isServer = true;

    this.handshakeConnect();
  }

  // Get input object of {keyCode : boolean} from the remote player for the passed in game tick.
  this.getRemoteInputState = function(tick) {
    if (tick > this.confirmedTick) {
      tick = this.confirmedTick; // Repeat the last confirmed input when we don't have a confirmed tick
    }
    return this.decodeInput(this.remoteInputHistory[tick % INPUT_HISTORY_SIZE]);
  }
  // Get input state for the local client (state = object of {keyCode : boolean})
  this.getLocalInputState = function(tick) {
    return this.decodeInput(this.inputHistory[tick % INPUT_HISTORY_SIZE]);
  }
  this.getLocalInputEncoded = function(tick) {
    return this.inputHistory[tick % INPUT_HISTORY_SIZE];
  }

  // Get the sync data which is used to check for game state desync between the clients.
  this.getSyncDataLocal = function(tick) {
    return this.syncDataHistoryLocal[tick % INPUT_HISTORY_SIZE];
  }
  // Get sync data from the remote client.
  this.getSyncDataRemote = function(tick) {
    return this.syncDataHistoryRemote[tick % INPUT_HISTORY_SIZE];
  }

  // Set sync data for a game tick
  this.setLocalSyncData = function(tick, syncData) {
    if (!this.isStateDesynced) {
      this.localSyncData = syncData;
      this.localSyncDataTick = tick;
    }
  }

  // Check for a desync.
  this.desyncCheck = function() {
    if (this.localSyncDataTick < 0) return false;

    // When the local sync data does not match the remote data indicate a desync has occurred.
    if (this.isStateDesynced || this.localSyncDataTick == this.remoteSyncDataTick) {
      // console.log("Desync Check at: " + this.localSyncDataTick)

      if (this.localSyncData != this.remoteSyncData) {
        this.isStateDesynced = true;
        return true;//, self.localSyncDataTick
      }
    }

    return false;
  }

  // Send the inputState for the local player to the remote player for the given game tick.
  this.sendInputData = function(tick) {
    // Don't send input data when not connect to another player's game client.
    if (!this.enabled && this.connectedToClient) return false;

    return this.sendPacket(this.makeInputPacket(tick), 1);
  }

  this.setLocalInput = function(inputs, tick) {
    return this.inputHistory[tick % INPUT_HISTORY_SIZE] = this.encodeInput(inputs);
  }
  this.setRemoteEncodedInput = function(encodedInput, tick) {
    return this.remoteInputHistory[tick % INPUT_HISTORY_SIZE] = encodedInput;
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
    this.connection.send(packet);
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
      const receivedTick = data.receivedTick;

      // We only care about the latest tick delta, so make sure the confirmed frame is atleast the same or newer.
      // This would work better if we added a packet count.
      if (receivedTick >= this.confirmedTick) {
        this.remoteTickDelta = data.tickDelta;
      }

      if (receivedTick > this.confirmedTick) {
        if (receivedTick - this.confirmedTick > this.INPUT_DELAY) {
          console.log("Received packet with a tick too far ahead. Last: " + this.confirmedTick + "     Current: " + receivedTick );
        }

        this.confirmedTick = receivedTick;
        // PacketLog("Received Input: " .. results[3+NET_SEND_HISTORY_SIZE] .. " @ " ..  receivedTick) 

        // data.inputs is an array of encoded inputState numbers starting with the receivedTick and progressing back in time
        var that = this;
        _.each(data.inputs, function(inputState, index){
          that.setRemoteEncodedInput(inputState, receivedTick-index); // update our record of the remote's encoded inputs
        })
      }
//      console.log(`Received Tick: ${receivedTick},  Input: ${this.remoteInputHistory[this.confirmedTick % INPUT_HISTORY_SIZE]}`)
    } else if (code == msgCode.ping) {
      this.sendPacket(this.makePongPacket(data.time));
    } else if (code == msgCode.pong) {
      this.latency = (new Date().getTime()) - data.time;
    } else if (code == msgCode.sync) {
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
  this.makeInputPacket = function(tick) {
    // data.inputs is an array of encoded inputState numbers starting with the receivedTick and progressing back in time
    let history = [];
    for (let i=0; i < SEND_HISTORY_SIZE; i+=1) {
      history[i] = this.inputHistory[(tick - i) % INPUT_HISTORY_SIZE];
    }

    return {
      code: msgCode.playerInput,
      tickDelta: this.localTickDelta,
      receivedTick: tick,
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
}
