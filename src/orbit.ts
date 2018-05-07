import { Vector, angleDiff } from "./vector";
import { Engine } from "./engine";

interface DrawPoint { X: number; Y: number; }

export class Orbit {
  public f1: Vector; public f2: Vector; public center: Vector;
  public u: number; public e: number; public a:number; public b:number; public f:number;
  public w:number; public energy: number; public apogee: number; public perigee: number;
  public orbitArea:number;
  public valid: boolean; public color: string;
  public drawPoints: DrawPoint[];
  constructor (sgp:number, e:number,a:number,w:number) {
    this.init(sgp,e,a,w);
  }

  private init(sgp:number, e:number,a:number,w:number) {
    this.u = sgp;
    this.e = e;
    this.a = a;
    this.w = w;
    this.valid = e < 1.0 && a > 0.0;
    this.f1 = new Vector();
    this.f = this.e*this.a;
    this.b = Math.sqrt(this.a*this.a - this.f*this.f);
    this.center = new Vector(); this.center.setRTheta(this.f, this.w);
    this.f2 = new Vector(); this.f2.setRTheta(2*this.f, this.w);
    this.energy =  -this.u/(2.0*this.a);
    this.apogee = this.a + this.f;
    this.perigee = this.a - this.f;
    this.orbitArea = Math.PI * this.a * this.b;
    this.calcDrawPoints();
  }

  public initPV(sgp, orbiterPos: Vector, orbiterVel: Vector) {
    this.f1 = new Vector();
    this.u = sgp;
    this.valid = true;
    var relativePos = new Vector(); relativePos.set(orbiterPos);
    relativePos.scalarMultiply(-1);
    var r = relativePos.getLength();
    if (r<= 0.0) { this.valid = false; return; }
    var v = orbiterVel.getLength();
    this.energy = (v*v/2.0) - (this.u/r);
    if (this.energy >= 0.0) { this.valid = false; return;}
    this.a = -this.u/(2.0*this.energy);
    var d = 2.0*this.a - r;
    var orbiterAngle = relativePos.getAngle();
    var velAngle = orbiterVel.getAngle();
    var theta = angleDiff(velAngle, orbiterAngle);
    var phi = Math.PI - theta;
    this.f2.set(orbiterVel);
    this.f2.setLength(d);
    this.f2.rotate(phi);
    this.f2.addVector(orbiterPos);
    this.w = this.f2.getAngle();
    this.f = this.f2.getLength() / 2;
    this.e = this.f / this.a;
    this.init(sgp, this.e, this.a, this.w);
  }

  public calcDrawPoints() {
    if (!this.valid) { return; }
    var xStep = 2.0*Engine.kmPerPixel;
    var numPoints = Math.round((2.0*this.a)/xStep) + 2; // the +2 is for rounding safety
    var maxDrawPoints = numPoints*2;
    this.drawPoints = [];
    var firstHalf: DrawPoint[] = [];
    var secondHalf: DrawPoint[] = [];
    var halfPos = 0;
    var x = - this.a;
    while (true) {
      var  alpha = 1.0-(x*x)/(this.a*this.a);
      var y = Math.sqrt(this.b*this.b*alpha);
      if ( halfPos >= numPoints ) { throw "Oops"; }
      var work = new Vector(x,y);
      work.rotate(this.w);
      work.addVector(this.center);
      firstHalf[halfPos] = {
        X: Engine.modelToViewX(work.X),
        Y: Engine.modelToViewY(work.Y)
      };
      work = new Vector(x,-y);
      work.rotate(this.w);
      work.addVector(this.center);
      secondHalf[halfPos] = {
        X: Engine.modelToViewX(work.X),
        Y: Engine.modelToViewY(work.Y)
      };
      halfPos++;
      if (x == this.a) { break; }
      x += xStep;
      if (x > this.a) { x = this.a; }
    }
    this.drawPoints = firstHalf;
    this.drawPoints.push.apply(secondHalf.reverse())
  }

  public drawSelf() {
    if (!this.valid || !this.drawPoints || this.drawPoints.length < 2) return;
    let {X: lastX, Y: lastY} = this.drawPoints[0];
    for (var p of this.drawPoints) {
      let {X: thisX, Y: thisY} = p;
      console.log(`Line (${lastX}, ${lastY})-(${thisX}, ${thisY})`);
      [lastX, lastY] = [thisX, thisY];
    }
  }

  public getR(theta: number) {
    if (!this.valid) {return 0}
    var numerator = this.a*(1.0-this.e*this.e);
    var denominator = 1.0-this.e*(Math.cos(theta-this.w));
    return numerator/denominator;
  }

  public getPos(theta: number) : Vector {
    var pos: Vector = new Vector();
    var r = this.getR(theta);
    pos.setRTheta(r,theta);
    return pos;
  }

  public getVel(theta: number) : Vector {
    var pos = this.getPos(theta);
    var r = pos.getLength();
    var vSquared= 2.0*(this.energy+this.u/r);
    var v = Math.sqrt(vSquared);
    var angleToF1 = Math.PI+theta;
    var lookAtF2 = new Vector();
    lookAtF2.set(this.f2);
    lookAtF2.subtractVector(pos);
    var angleToF2 = lookAtF2.getAngle();
    var diff = angleDiff(angleToF1, angleToF2);
    var angle = angleToF1 + diff/2.0;
    var velAngle = angle + (Math.PI/2.0);
    var out = new Vector();
    out.setRTheta(v, velAngle);
    return out;
  }
}