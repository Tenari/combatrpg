import {World} from './world.js';
import {Body} from './body.js';

export function Engine() {
  let world = new World();

  this.addToWorld = function(bodies) {
    _.each(bodies, function(body){
      world.addBody(body);
    })
  };

  this.update = function(timestep) {
    // apply Gravity to all bodies
    applyGravity(world.bodies, world.gravity);
    // update all bodies by integration
    updateBodies(world.bodies, timestep);
    // find collisions;
    let collisions = findCollisions(world.bodies)
    console.log(collisions);
    // TODO: resolve collisions
    for(var i = 0; i< collisions.length; i++) {
      let bodyA = _.find(world.bodies, function(b) {return b.id == collisions[i].a;})
      let bodyB = _.find(world.bodies, function(b) {return b.id == collisions[i].b;})
      if (!bodyA.isStatic && !bodyA.isSleeping) {
        console.log('stopping body:', bodyA);
        bodyA.pos.x = bodyA.posPrev.x;
        bodyA.pos.y = bodyA.posPrev.y;
        bodyA.velocity = {x: 0, y: 0};
      }
      if (!bodyB.isStatic && !bodyB.isSleeping) {
        console.log('stopping body:', bodyB);
        bodyB.pos.x = bodyB.posPrev.x;
        bodyB.pos.y = bodyB.posPrev.y;
        bodyB.velocity = {x: 0, y: 0};
      }
    }
  };

  const applyGravity = (bodies, gravity) => {
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i].isStatic || bodies[i].isSleeping)
        continue;

      bodies[i].velocity.y += gravity;

      if (bodies[i].fallSpeed > bodies[i].velocity.y)
        bodies[i].velocity.y = bodies[i].fallSpeed;
    }
  };

  const updateBodies = (bodies, timestep) => {
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i].isStatic || bodies[i].isSleeping)
        continue;

      bodies[i].update(timestep);
    }
  };

  const findCollisions = (bodies) => {
    let collisions = [];
    for (var i = 0; i < bodies.length; i++) {
      let bodyA = bodies[i];
      for (var j = 0; j < bodies.length; j++) {
        if (j == i) continue;
        if (_.find(collisions, function(c) {return c.b == bodyA.id && c.a == bodies[j].id})) continue;

        let bodyB = bodies[j];
        if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping))
          continue;

        let boundsA = makeBounds(bodyA);
        let boundsB = makeBounds(bodyB);
        if (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x
            && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y) {
          collisions.push({a: bodyA.id, b: bodyB.id});
        }
      }
    }
    return collisions;
  };

  const makeBounds = (body) => {
    let bounds = {min:{x: Infinity, y: Infinity},max:{x: -Infinity, y: -Infinity}};
    for (var i = 0; i < body.verts.length; i++) {
      let vert = body.verts[i];
      if (vert.x < bounds.min.x) bounds.min.x = vert.x;
      if (vert.y < bounds.min.y) bounds.min.y = vert.y;
      if (vert.x > bounds.max.x) bounds.max.x = vert.x;
      if (vert.y > bounds.max.y) bounds.max.y = vert.y;
    }
    return bounds;
  }
}
