import { Vector, angleDiff, getDistance } from "./vector";
import { OBObject } from "./object";
import { Engine } from "./engine";

enum AccType { Normal, Redirect, StopTrace };

export interface AccelerationPoint
{
  pointIdx: number; // the point index that this acceleration takes effect
  type  : AccType;
  angle: number;
  mag: number;
};

var PATH_ACCELERATION = 0.000002;
var POINTS_TIME = 86400.0;
var FATAL_SUN_APPROACH = 35000000.0;
var DISPLAY_THRUSTLINE_LENGTH = 50;

export class Path {
  public startPos: Vector;
  public startVel: Vector;
  public points: Vector[];
  public orbitee: OBObject;
  public accelerationPoints: AccelerationPoint[];
  public color;
  public size;

  constructor () {
    this.accelerationPoints = [];
    this.points = [];
  }
  public init(orbitee: OBObject, pos: Vector, vel: Vector, color, size) {
    this.initNoAcc(orbitee, pos, vel, color, size);
    var newPoint: AccelerationPoint = this.createAccelerationPoint(0);
    newPoint.angle = Math.PI/2.0;
    newPoint.mag = PATH_ACCELERATION;
    this.calcPoints();
  }

  public initNoAcc(orbitee: OBObject, pos: Vector, vel: Vector, color, size) {
    this.color = color; this.size = size;
    this.orbitee = orbitee;
    this.startPos = new Vector(); this.startPos.set(pos);
    this.startVel = new Vector(); this.startVel.set(vel);
    this.calcPoints();
  }
  public initNoAccOrbiterAngle(orbiter: OBObject, angle: number) {
     angle = -Math.PI/2.0-angle;
     var orbitee = orbiter.orbitee;
     var pos = orbiter.orbit.getPos(angle);
     var vel = orbiter.orbit.getVel(angle);
     return this.initNoAcc(orbitee, pos,vel,orbiter.orbit.color, orbiter.size);
  }

  public removeAccelerationPoint(ap: AccelerationPoint) {
    this.accelerationPoints = this.accelerationPoints.filter(obj => obj !== ap);
  }

  public adjustAccelerationPoint(ap: AccelerationPoint, mx,my,newMag) {
    var pointIdx = ap.pointIdx;
    var apX = Engine.modelToViewX(this.points[pointIdx].X);
    var apY = Engine.modelToViewY(this.points[pointIdx].Y);
    var newLine = new Vector(mx-apX, my-apY);
    var unadjustedAng = newLine.getAngle();
    var grav = this.getGravForPoint(pointIdx);
    var gravAng = grav.getAngle();
    ap.angle = angleDiff(gravAng, unadjustedAng);
    ap.mag = newMag;
  }

  public getGravForPoint(pointIdx):Vector {
    var result = new Vector();
    result.set(this.orbitee.pos);
    if ( pointIdx == 0 ) {
      result.subtractVector(this.startPos);
    } else {
      result.subtractVector(this.points[pointIdx-1]);
    }
    return result;
  }

  public createAccelerationPoint(pointIdx): AccelerationPoint {
    var ap = { pointIdx: pointIdx } as AccelerationPoint;
    if (this.accelerationPoints.length > 0) {
      var thrust = this.getThrustForPoint(pointIdx);
      ap.mag = thrust.getLength();
      var grav = this.getGravForPoint(pointIdx);
      ap.angle = angleDiff(grav.getAngle(), thrust.getAngle());
    }
    ap.type =AccType.Normal;
    this.accelerationPoints.push(ap);
    return ap;
  }

  public getThrustForPoint(pointIdx) : Vector {
    if (this.accelerationPoints.length < 1) { return new Vector() }
    var grav = this.getGravForPoint(pointIdx);
    var ap : AccelerationPoint;
    for (var thisAp of this.accelerationPoints) {
      if (thisAp.pointIdx > pointIdx) {
        break;
      }
      ap = thisAp;
    }
    if (!ap) {
      ap = this.accelerationPoints[this.accelerationPoints.length-1];
    }
    var acc = new Vector();
    acc.set(grav);
    acc.rotate(ap.angle);
    acc.setLength(ap.mag);
    return acc;
  }

  private calcPoints() {
    var pos = new Vector(); pos.set(this.startPos);
    var vel = new Vector(); vel.set(this.startVel);
    var stopIdx = this.getStopPoint();
    if(!this.points[0]) { this.points[0] = new Vector(); }
    this.points[0].set(pos);
    var halt = false;
    for (var i = 0; i<= stopIdx; i++) {
      if (!this.points[i]) { this.points[i] = new Vector() }
      if (halt) { this.points[i].set(this.points[i-1]); continue }
      var grav = new Vector(); grav.set(this.orbitee.pos);
      grav.subtractVector(pos);
      var gravAccLen = (POINTS_TIME * this.orbitee.sgp)/grav.getLengthSq();
      grav.setLength(gravAccLen);
      vel.addVector(grav);
      var thrustAcc = this.getThrustForPoint(i);
      thrustAcc.scalarMultiply(POINTS_TIME);
      vel.addVector(thrustAcc);
      var ap:AccelerationPoint;
      for (ap of this.accelerationPoints) {
        if (ap.pointIdx != i) continue;
        if (ap.type == AccType.Redirect) {
          vel.setRTheta(vel.getLength(), thrustAcc.getAngle());
        }
        break;
      }
      var work = new Vector();
      work.set(vel);
      work.scalarMultiply(POINTS_TIME);
      pos.addVector(work);
      if (!this.points[i]) { this.points[i] = new Vector() }
      this.points[i].set(pos);
      if (getDistance(this.points[i], this.orbitee.pos) < FATAL_SUN_APPROACH) {
        halt = true;
      }
    }
  }
  public drawSelf(sel?) {
    var stopIdx = this.getStopPoint();
    var lastX; var lastY;
    Engine.ctx.strokeStyle=this.color;
    Engine.ctx.beginPath();
    for (var i=0 ; i<=stopIdx ; i++ ) {
      if (i > this.points.length) { break;}
      var x = Engine.modelToViewX(this.points[i].X);
      var y = Engine.modelToViewY(this.points[i].Y);
      if (i > 0) {
        Engine.ctx.lineTo(x,y);
      } else {
        Engine.ctx.moveTo(x,y);
      }
    }
    Engine.ctx.stroke();
    var ap: AccelerationPoint;
    for (ap of this.accelerationPoints) {
      // XXX
    }
  }

  public getStopPoint() {
    var highestIdx = 0;
    var ap: AccelerationPoint;
    for (ap of this.accelerationPoints) {
      if ( ap.type == AccType.StopTrace) { return ap.pointIdx; }
    }
    return 900-1;
  }

  public getNearestPointIdx(viewX, viewY) {
    var MAX_DIST = DISPLAY_THRUSTLINE_LENGTH + DISPLAY_THRUSTLINE_LENGTH/10;
    var MAX_DIST_SQ = MAX_DIST*MAX_DIST;
    var stopIdx = this.getStopPoint();
    var closestIdx = -1;
    var closestDistSq = 0;
    for ( var i=0 ; i<=stopIdx ; i++ ) {
      var dx = viewX - Engine.modelToViewX(this.points[i].X);
      var dy = viewY - Engine.modelToViewY(this.points[i].Y);
      var distSq = dx*dx + dy*dy;
      if ( distSq < MAX_DIST_SQ ) {
        if ( (closestIdx == -1) || (distSq < closestDistSq) ) {
          closestDistSq = distSq;
          closestIdx = i;
        }
      }
    }
    return closestIdx;
  }

  public getNearestAccelPoint(viewX, viewY) {
    var MAX_DIST = DISPLAY_THRUSTLINE_LENGTH + DISPLAY_THRUSTLINE_LENGTH/10;
    var MAX_DIST_SQ = MAX_DIST*MAX_DIST;
    var stopIdx = this.getStopPoint();
    var closestAp;
    var closestDistSq = 0;
    var ap: AccelerationPoint;
    for (ap of this.accelerationPoints) {
      var dx = viewX - Engine.modelToViewX(this.points[ap.pointIdx].X);
      var dy = viewY - Engine.modelToViewY(this.points[ap.pointIdx].Y);
      var distSq = dx*dx + dy*dy;
      if ( distSq < MAX_DIST_SQ ) {
        if ( (!closestAp) || (distSq < closestDistSq) ) {
          closestDistSq = distSq;
          closestAp = ap;
        }
      }
    }
    return closestAp;
  }

  public load(dv: DataView, off:number):number {
    this.startPos.X = dv.getFloat64(off,true); off+=8;
    this.startPos.Y = dv.getFloat64(off,true); off+=8;
    this.startVel.X = dv.getFloat64(off,true); off+=8;
    this.startVel.Y = dv.getFloat64(off,true); off+=8;
    this.accelerationPoints = [];
    var numPoints = dv.getInt32(off); off+=4;
    for ( var i=0 ; i<numPoints ; i++ ) {
      var ap = {} as AccelerationPoint;
      ap.pointIdx = dv.getInt32(off); off+=4;
      ap.type = dv.getInt32(off); off+=4;
      ap.angle = dv.getFloat64(off,true); off += 8;
      ap.mag = dv.getFloat64(off,true); off += 8;
      this.accelerationPoints.push(ap);
    }
    this.calcPoints()
    return off;
  }
}