import { Vector } from "./vector";
import { Orbit } from "./orbit";
import { Engine } from "./engine";
import * as $ from "jquery";

export class OBObject {
  public pos: Vector;
  public vel: Vector;
  public color: string;
  public size: number;
  public sgp: number;
  public orbitee: OBObject;
  public orbit: Orbit;

  constructor (sgp, pos, vel, color, size, orbitee) {
    this.sgp = sgp; this.pos=pos;this.vel=vel; this.color=color;
    this.size= size; this.orbitee = orbitee;
  }

  public initOrbiter (orbitee: OBObject, apogeeDist: number, apogeeVel: number,
    aop: number) {
    this.orbitee = orbitee;
    var angleOfApogee = aop - 3.14159;
    this.pos.setRTheta(apogeeDist, angleOfApogee);
    this.pos.addVector(orbitee.pos);
    this.vel.set(this.pos);
    this.vel.rotate(-3.14159/2.0);
    this.vel.setLength(apogeeVel);
    this.orbit = new Orbit(0,0,0,0);
    this.orbit.initPV(orbitee.sgp, this.pos, this.vel)
    this.orbit.color = this.color;
  }

  public tick (seconds: number) {
    if (!this.orbitee) { return }
    var acc: Vector = new Vector;
    acc.set(this.orbitee.pos)
    acc.subtractVector(this.pos);
    var accLen = (seconds * this.orbitee.sgp)/acc.getLengthSq();
    acc.setLength(accLen);
    this.vel.addVector(acc);
    var toAdd: Vector = new Vector;
    toAdd.set(this.vel);
    toAdd.scalarMultiply(seconds);
    this.pos.addVector(toAdd);
  }

  public drawSelf() {
    if(this.orbit) { this.orbit.drawSelf(); }
    var x = Engine.modelToViewX(this.pos.X);
    var y = Engine.modelToViewY(this.pos.Y);
    Engine.ctx.fillStyle=this.color;
    Engine.ctx.beginPath();
    Engine.ctx.arc(x,y,this.size,0,2*Math.PI);
    Engine.ctx.fill();
  }

  public recalcOrbit() {
    this.orbit.initPV(this.orbit.u, this.pos, this.vel)
  }
}