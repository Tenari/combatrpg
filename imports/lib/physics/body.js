var globalId = 0;
export function Body(opts) {
  const x = opts.x || 0;
  const y = opts.y || 0;
  const verts = opts.verts || [{x: x+1, y: y+1}, {x: x-1, y: y-1}, {x,y}];
  this.type = 'body';
  this.id = globalId; globalId += 1;
  this.velocity = opts.velocity || {x:0, y:0};
  this.pos = {x, y};
  this.posPrev = {x, y};
  this.verts = verts;
  this.isStatic = opts.isStatic;
  this.fallSpeed = opts.fallSpeed || 10; // fall speed is the max fall speed the body can attain. Acceleration due to gravity is determined worldwide

  this.update = (timestep) => {
    this.posPrev.x = this.pos.x;
    this.posPrev.y = this.pos.y;

    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;

    for (var i = 0; i < this.verts.length; i++) {
      this.verts[i].x += this.velocity.x;
      this.verts[i].y += this.velocity.y;
    }
  }
}
