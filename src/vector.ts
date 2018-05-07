export class Vector {
  public X : number = 0;
  public Y : number = 0;
  constructor(x=0,y=0) {
    this.X = x; this.Y=y;
  }
  public set(v: Vector) {this.X = v.X; this.Y = v.Y; }

  public addVector(v: Vector) { this.X += v.X; this.Y += v.Y; }
  public subtractVector(v: Vector) { this.X -= v.X; this.Y -= v.Y; }
  public scalarMultiply(n: number) { this.X *= n; this.Y *= n; }

  public getLengthSq() { return this.X * this.X + this.Y * this.Y; }
  public getLength() { return Math.sqrt(this.getLengthSq())}

  public setLength(n: number) {
    var len = Math.sqrt(this.getLengthSq());
    this.scalarMultiply(n/len);
  }

  public rotate(ang: number) {
    [this.X, this.Y] = [this.X * Math.cos(ang) - this.Y * Math.sin(ang),
                     this.X * Math.sin(ang) + this.Y * Math.cos(ang)];
  }

  public setRTheta(r:number, theta: number) {
    [this.X, this.Y] = [r * Math.cos(theta), r * Math.sin(theta)];
  }

  public getAngle() {return Math.atan2(this.Y, this.X) }
}

export function getDistance(a: Vector, b: Vector) {
  return Math.sqrt((a.X-b.X)*(a.X-b.X) + (a.Y-b.Y)*(a.Y-b.Y))
}

export function angleDiff(b1Rad, b2Rad) {
  var b1y = Math.cos(b1Rad);
  var b1x = Math.sin(b1Rad);
  var b2y = Math.cos(b2Rad);
  var b2x = Math.sin(b2Rad);
  var crossp = b1y * b2x - b2y * b1x;
  var dotp = b1x * b2x + b1y * b2y;
  if(crossp > 0.)
    return Math.acos(dotp);
  return -Math.acos(dotp);
}