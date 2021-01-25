export function World() {
  this.type = 'world';
  this.id = 0;
  this.bodies = [];
  this.gravity = 1;

  this.addBody = function(body){
    this.bodies.push(body);
  };
}
