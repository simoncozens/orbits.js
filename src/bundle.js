(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vector_1 = require("./vector");
var object_1 = require("./object");
var path_1 = require("./path");
var MARS_APOGEE = 249209300.0;
var SUN_SGP = 132712440018.0;
var MARS_APOGEE_VEL = 21.97;
var MARS_AOP = 4.9997;
var EARTH_APOGEE = 152098232.0;
var EARTH_APOGEE_VEL = 29.3;
var EARTH_AOP = 1.99330;
var root = this;
var POINTS_TIME = 86400.0;
var UIMode;
(function (UIMode) {
    UIMode[UIMode["Normal"] = 0] = "Normal";
    UIMode[UIMode["Playback"] = 1] = "Playback";
    UIMode[UIMode["AddingPoint"] = 2] = "AddingPoint";
    UIMode[UIMode["Inert"] = 3] = "Inert";
})(UIMode || (UIMode = {}));
;
var EngineSingleton = /** @class */ (function () {
    function EngineSingleton() {
        // UI stuff
        this.uiMode = UIMode.Normal;
        this.hoverPathPointIdx = -1;
    }
    EngineSingleton.prototype.init = function (el) {
        var _this = this;
        if (el) {
            this.screenW = el.width();
            this.screenH = el.height();
            this.ctx = el[0].getContext("2d");
            $(el).on("mousemove", function (e) { return _this.mouseMove(e); });
            $(window).keydown(function (e) { return _this.keyDown(e); });
            $(window).keyup(function (e) { return _this.keyUp(e); });
        }
        else {
            this.screenW = 640;
            this.screenH = 480;
        }
        this.center = new vector_1.Vector();
        var r = MARS_APOGEE * 1.05;
        var width = r * 2.0;
        this.kmPerPixel = 2 * width / this.screenW;
        var sunPos = new vector_1.Vector();
        var sunVel = new vector_1.Vector();
        this.sun = new object_1.OBObject(SUN_SGP, sunPos, sunVel, "#ffff00", 8, null);
        this.mars = new object_1.OBObject(0, new vector_1.Vector(), new vector_1.Vector(), "#ff7f7f", 1, this.sun);
        this.mars.initOrbiter(this.sun, MARS_APOGEE, MARS_APOGEE_VEL, MARS_AOP);
        this.earth = new object_1.OBObject(0, new vector_1.Vector(), new vector_1.Vector(), "#7f7fff", 1, this.sun);
        this.earth.initOrbiter(this.sun, EARTH_APOGEE, EARTH_APOGEE_VEL, EARTH_AOP);
        this.marsPath = new path_1.Path();
        this.marsPath.initNoAccOrbiterAngle(this.mars, 5.4429575522);
        this.earthPath = new path_1.Path();
        this.earthPath.initNoAccOrbiterAngle(this.earth, 4.9745875522);
        this.ship = new path_1.Path();
        this.ship.init(this.sun, this.earthPath.startPos, this.earthPath.startVel, "#7f7f7f", 5);
    };
    EngineSingleton.prototype.modelToViewX = function (modelX) {
        var x = modelX - this.center.X;
        x /= this.kmPerPixel;
        return x + this.screenW / 2;
    };
    EngineSingleton.prototype.modelToViewY = function (modelY) {
        var y = modelY - this.center.Y;
        y /= this.kmPerPixel;
        return y + this.screenH / 2;
    };
    EngineSingleton.prototype.drawSelf = function () {
        if (this.uiMode == UIMode.Playback) {
            this.drawPlayback();
        }
        else {
            this.drawNormal();
        }
    };
    EngineSingleton.prototype.drawPlayback = function () {
    };
    EngineSingleton.prototype.drawNormal = function () {
        this.ctx.canvas.width = this.screenW;
        this.ctx.canvas.height = this.screenH;
        this.ctx.clearRect(0, 0, this.screenW, this.screenH);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.screenW, this.screenH);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(100, 100);
        this.ctx.stroke();
        this.sun.drawSelf();
        this.earthPath.drawSelf();
        this.marsPath.drawSelf();
        this.ship.drawSelf(this.hoverAccelPoint);
        if (this.hoverPathPointIdx != -1) {
            this.ctx.strokeStyle = "#ff0000";
            // this.ship.drawThrustLine(this.hoverPathPointIdx);
            var daynum = (this.hoverPathPointIdx * 86400) / POINTS_TIME + 1;
            var em = vector_1.getDistance(this.earthPath.points[this.hoverPathPointIdx], this.marsPath.points[this.hoverPathPointIdx]);
            var eh = vector_1.getDistance(this.earthPath.points[this.hoverPathPointIdx], this.ship.points[this.hoverPathPointIdx]);
            var hm = vector_1.getDistance(this.marsPath.points[this.hoverPathPointIdx], this.ship.points[this.hoverPathPointIdx]);
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "12px Arial";
            this.ctx.fillText("Day: " + daynum.toFixed(0), 10, 20);
            this.ctx.fillText("Earth-Mars: " + this.distInfo(em), 10, 36);
            this.ctx.fillText("Earth-Hermes: " + this.distInfo(eh), 10, 52);
            this.ctx.fillText("Hermes-Mars: " + this.distInfo(hm), 10, 68);
        }
        var idx = this.hoverPathPointIdx;
        if (idx < 1) {
            idx = 0;
        }
        this.ctx.fillStyle = this.earth.color;
        this.drawPathObject(this.earthPath, idx);
        this.ctx.fillStyle = this.mars.color;
        this.drawPathObject(this.marsPath, idx);
    };
    EngineSingleton.prototype.drawPathObject = function (toDraw, pointIdx) {
        var stopPoint = toDraw.getStopPoint();
        if (pointIdx > stopPoint)
            return;
        var x = this.modelToViewX(toDraw.points[pointIdx].X);
        var y = this.modelToViewY(toDraw.points[pointIdx].Y);
        exports.Engine.ctx.strokeStyle = "#fff";
        exports.Engine.ctx.beginPath();
        exports.Engine.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        exports.Engine.ctx.stroke();
    };
    EngineSingleton.prototype.distInfo = function (dist) {
        var lightSeconds = dist / 300000;
        var lightMinutes = lightSeconds / 60;
        lightSeconds = lightSeconds % 60;
        return dist.toFixed(0) + "km, " + lightMinutes.toFixed(0) + "m " + lightSeconds.toFixed(0) + "s";
    };
    EngineSingleton.prototype.load = function (data) {
    };
    EngineSingleton.prototype.mouseMove = function (evt) {
        var rect = $("#canvas")[0].getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        if (this.uiMode == UIMode.AddingPoint) {
            this.hoverPathPointIdx = this.ship.getNearestPointIdx(x, y);
        }
        else {
            this.hoverAccelPoint = this.ship.getNearestAccelPoint(x, y);
        }
        this.drawSelf();
    };
    EngineSingleton.prototype.keyDown = function (evt) {
        var key = evt.key;
        if (key == "Shift") {
            this.hoverPathPointIdx = -1;
            this.hoverAccelPoint = null;
            this.uiMode = UIMode.AddingPoint;
        }
    };
    EngineSingleton.prototype.keyUp = function (evt) {
        var key = evt.key;
        if (key == "Shift") {
            this.hoverPathPointIdx = -1;
            this.hoverAccelPoint = null;
            this.uiMode = UIMode.Normal;
        }
    };
    return EngineSingleton;
}());
;
exports.Engine = new EngineSingleton();

},{"./object":2,"./path":4,"./vector":6}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vector_1 = require("./vector");
var orbit_1 = require("./orbit");
var engine_1 = require("./engine");
var OBObject = /** @class */ (function () {
    function OBObject(sgp, pos, vel, color, size, orbitee) {
        this.sgp = sgp;
        this.pos = pos;
        this.vel = vel;
        this.color = color;
        this.size = size;
        this.orbitee = orbitee;
    }
    OBObject.prototype.initOrbiter = function (orbitee, apogeeDist, apogeeVel, aop) {
        this.orbitee = orbitee;
        var angleOfApogee = aop - 3.14159;
        this.pos.setRTheta(apogeeDist, angleOfApogee);
        this.pos.addVector(orbitee.pos);
        this.vel.set(this.pos);
        this.vel.rotate(-3.14159 / 2.0);
        this.vel.setLength(apogeeVel);
        this.orbit = new orbit_1.Orbit(0, 0, 0, 0);
        this.orbit.initPV(orbitee.sgp, this.pos, this.vel);
        this.orbit.color = this.color;
    };
    OBObject.prototype.tick = function (seconds) {
        if (!this.orbitee) {
            return;
        }
        var acc = new vector_1.Vector;
        acc.set(this.orbitee.pos);
        acc.subtractVector(this.pos);
        var accLen = (seconds * this.orbitee.sgp) / acc.getLengthSq();
        acc.setLength(accLen);
        this.vel.addVector(acc);
        var toAdd = new vector_1.Vector;
        toAdd.set(this.vel);
        toAdd.scalarMultiply(seconds);
        this.pos.addVector(toAdd);
    };
    OBObject.prototype.drawSelf = function () {
        if (this.orbit) {
            this.orbit.drawSelf();
        }
        var x = engine_1.Engine.modelToViewX(this.pos.X);
        var y = engine_1.Engine.modelToViewY(this.pos.Y);
        engine_1.Engine.ctx.fillStyle = this.color;
        engine_1.Engine.ctx.beginPath();
        engine_1.Engine.ctx.arc(x, y, this.size, 0, 2 * Math.PI);
        engine_1.Engine.ctx.fill();
    };
    OBObject.prototype.recalcOrbit = function () {
        this.orbit.initPV(this.orbit.u, this.pos, this.vel);
    };
    return OBObject;
}());
exports.OBObject = OBObject;

},{"./engine":1,"./orbit":3,"./vector":6}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vector_1 = require("./vector");
var engine_1 = require("./engine");
var Orbit = /** @class */ (function () {
    function Orbit(sgp, e, a, w) {
        this.init(sgp, e, a, w);
    }
    Orbit.prototype.init = function (sgp, e, a, w) {
        this.u = sgp;
        this.e = e;
        this.a = a;
        this.w = w;
        this.valid = e < 1.0 && a > 0.0;
        this.f1 = new vector_1.Vector();
        this.f = this.e * this.a;
        this.b = Math.sqrt(this.a * this.a - this.f * this.f);
        this.center = new vector_1.Vector();
        this.center.setRTheta(this.f, this.w);
        this.f2 = new vector_1.Vector();
        this.f2.setRTheta(2 * this.f, this.w);
        this.energy = -this.u / (2.0 * this.a);
        this.apogee = this.a + this.f;
        this.perigee = this.a - this.f;
        this.orbitArea = Math.PI * this.a * this.b;
        this.calcDrawPoints();
    };
    Orbit.prototype.initPV = function (sgp, orbiterPos, orbiterVel) {
        this.f1 = new vector_1.Vector();
        this.u = sgp;
        this.valid = true;
        var relativePos = new vector_1.Vector();
        relativePos.set(orbiterPos);
        relativePos.scalarMultiply(-1);
        var r = relativePos.getLength();
        if (r <= 0.0) {
            this.valid = false;
            return;
        }
        var v = orbiterVel.getLength();
        this.energy = (v * v / 2.0) - (this.u / r);
        if (this.energy >= 0.0) {
            this.valid = false;
            return;
        }
        this.a = -this.u / (2.0 * this.energy);
        var d = 2.0 * this.a - r;
        var orbiterAngle = relativePos.getAngle();
        var velAngle = orbiterVel.getAngle();
        var theta = vector_1.angleDiff(velAngle, orbiterAngle);
        var phi = Math.PI - theta;
        this.f2.set(orbiterVel);
        this.f2.setLength(d);
        this.f2.rotate(phi);
        this.f2.addVector(orbiterPos);
        this.w = this.f2.getAngle();
        this.f = this.f2.getLength() / 2;
        this.e = this.f / this.a;
        this.init(sgp, this.e, this.a, this.w);
    };
    Orbit.prototype.calcDrawPoints = function () {
        if (!this.valid) {
            return;
        }
        var xStep = 2.0 * engine_1.Engine.kmPerPixel;
        var numPoints = Math.round((2.0 * this.a) / xStep) + 2; // the +2 is for rounding safety
        var maxDrawPoints = numPoints * 2;
        this.drawPoints = [];
        var firstHalf = [];
        var secondHalf = [];
        var halfPos = 0;
        var x = -this.a;
        while (true) {
            var alpha = 1.0 - (x * x) / (this.a * this.a);
            var y = Math.sqrt(this.b * this.b * alpha);
            if (halfPos >= numPoints) {
                throw "Oops";
            }
            var work = new vector_1.Vector(x, y);
            work.rotate(this.w);
            work.addVector(this.center);
            firstHalf[halfPos] = {
                X: engine_1.Engine.modelToViewX(work.X),
                Y: engine_1.Engine.modelToViewY(work.Y)
            };
            work = new vector_1.Vector(x, -y);
            work.rotate(this.w);
            work.addVector(this.center);
            secondHalf[halfPos] = {
                X: engine_1.Engine.modelToViewX(work.X),
                Y: engine_1.Engine.modelToViewY(work.Y)
            };
            halfPos++;
            if (x == this.a) {
                break;
            }
            x += xStep;
            if (x > this.a) {
                x = this.a;
            }
        }
        this.drawPoints = firstHalf;
        this.drawPoints.push.apply(secondHalf.reverse());
    };
    Orbit.prototype.drawSelf = function () {
        if (!this.valid || !this.drawPoints || this.drawPoints.length < 2)
            return;
        var _a = this.drawPoints[0], lastX = _a.X, lastY = _a.Y;
        for (var _i = 0, _b = this.drawPoints; _i < _b.length; _i++) {
            var p = _b[_i];
            var thisX = p.X, thisY = p.Y;
            console.log("Line (" + lastX + ", " + lastY + ")-(" + thisX + ", " + thisY + ")");
            _c = [thisX, thisY], lastX = _c[0], lastY = _c[1];
        }
        var _c;
    };
    Orbit.prototype.getR = function (theta) {
        if (!this.valid) {
            return 0;
        }
        var numerator = this.a * (1.0 - this.e * this.e);
        var denominator = 1.0 - this.e * (Math.cos(theta - this.w));
        return numerator / denominator;
    };
    Orbit.prototype.getPos = function (theta) {
        var pos = new vector_1.Vector();
        var r = this.getR(theta);
        pos.setRTheta(r, theta);
        return pos;
    };
    Orbit.prototype.getVel = function (theta) {
        var pos = this.getPos(theta);
        var r = pos.getLength();
        var vSquared = 2.0 * (this.energy + this.u / r);
        var v = Math.sqrt(vSquared);
        var angleToF1 = Math.PI + theta;
        var lookAtF2 = new vector_1.Vector();
        lookAtF2.set(this.f2);
        lookAtF2.subtractVector(pos);
        var angleToF2 = lookAtF2.getAngle();
        var diff = vector_1.angleDiff(angleToF1, angleToF2);
        var angle = angleToF1 + diff / 2.0;
        var velAngle = angle + (Math.PI / 2.0);
        var out = new vector_1.Vector();
        out.setRTheta(v, velAngle);
        return out;
    };
    return Orbit;
}());
exports.Orbit = Orbit;

},{"./engine":1,"./vector":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vector_1 = require("./vector");
var engine_1 = require("./engine");
var AccType;
(function (AccType) {
    AccType[AccType["Normal"] = 0] = "Normal";
    AccType[AccType["Redirect"] = 1] = "Redirect";
    AccType[AccType["StopTrace"] = 2] = "StopTrace";
})(AccType || (AccType = {}));
;
;
var PATH_ACCELERATION = 0.000002;
var POINTS_TIME = 86400.0;
var FATAL_SUN_APPROACH = 35000000.0;
var DISPLAY_THRUSTLINE_LENGTH = 50;
var Path = /** @class */ (function () {
    function Path() {
        this.accelerationPoints = [];
        this.points = [];
    }
    Path.prototype.init = function (orbitee, pos, vel, color, size) {
        this.initNoAcc(orbitee, pos, vel, color, size);
        var newPoint = this.createAccelerationPoint(0);
        newPoint.angle = Math.PI / 2.0;
        newPoint.mag = PATH_ACCELERATION;
        this.calcPoints();
    };
    Path.prototype.initNoAcc = function (orbitee, pos, vel, color, size) {
        this.color = color;
        this.size = size;
        this.orbitee = orbitee;
        this.startPos = new vector_1.Vector();
        this.startPos.set(pos);
        this.startVel = new vector_1.Vector();
        this.startVel.set(vel);
        this.calcPoints();
    };
    Path.prototype.initNoAccOrbiterAngle = function (orbiter, angle) {
        angle = -Math.PI / 2.0 - angle;
        var orbitee = orbiter.orbitee;
        var pos = orbiter.orbit.getPos(angle);
        var vel = orbiter.orbit.getVel(angle);
        return this.initNoAcc(orbitee, pos, vel, orbiter.orbit.color, orbiter.size);
    };
    Path.prototype.removeAccelerationPoint = function (ap) {
        this.accelerationPoints = this.accelerationPoints.filter(function (obj) { return obj !== ap; });
    };
    Path.prototype.adjustAccelerationPoint = function (ap, mx, my, newMag) {
        var pointIdx = ap.pointIdx;
        var apX = engine_1.Engine.modelToViewX(this.points[pointIdx].X);
        var apY = engine_1.Engine.modelToViewY(this.points[pointIdx].Y);
        var newLine = new vector_1.Vector(mx - apX, my - apY);
        var unadjustedAng = newLine.getAngle();
        var grav = this.getGravForPoint(pointIdx);
        var gravAng = grav.getAngle();
        ap.angle = vector_1.angleDiff(gravAng, unadjustedAng);
        ap.mag = newMag;
    };
    Path.prototype.getGravForPoint = function (pointIdx) {
        var result = new vector_1.Vector();
        result.set(this.orbitee.pos);
        if (pointIdx == 0) {
            result.subtractVector(this.startPos);
        }
        else {
            result.subtractVector(this.points[pointIdx - 1]);
        }
        return result;
    };
    Path.prototype.createAccelerationPoint = function (pointIdx) {
        var ap = { pointIdx: pointIdx };
        if (this.accelerationPoints.length > 0) {
            var thrust = this.getThrustForPoint(pointIdx);
            ap.mag = thrust.getLength();
            var grav = this.getGravForPoint(pointIdx);
            ap.angle = vector_1.angleDiff(grav.getAngle(), thrust.getAngle());
        }
        ap.type = AccType.Normal;
        this.accelerationPoints.push(ap);
        return ap;
    };
    Path.prototype.getThrustForPoint = function (pointIdx) {
        if (this.accelerationPoints.length < 1) {
            return new vector_1.Vector();
        }
        var grav = this.getGravForPoint(pointIdx);
        var ap;
        for (var _i = 0, _a = this.accelerationPoints; _i < _a.length; _i++) {
            var thisAp = _a[_i];
            if (thisAp.pointIdx > pointIdx) {
                break;
            }
            ap = thisAp;
        }
        if (!ap) {
            ap = this.accelerationPoints[this.accelerationPoints.length - 1];
        }
        var acc = new vector_1.Vector();
        acc.set(grav);
        acc.rotate(ap.angle);
        acc.setLength(ap.mag);
        return acc;
    };
    Path.prototype.calcPoints = function () {
        var pos = new vector_1.Vector();
        pos.set(this.startPos);
        var vel = new vector_1.Vector();
        vel.set(this.startVel);
        var stopIdx = this.getStopPoint();
        if (!this.points[0]) {
            this.points[0] = new vector_1.Vector();
        }
        this.points[0].set(pos);
        var halt = false;
        for (var i = 0; i <= stopIdx; i++) {
            if (!this.points[i]) {
                this.points[i] = new vector_1.Vector();
            }
            if (halt) {
                this.points[i].set(this.points[i - 1]);
                continue;
            }
            var grav = new vector_1.Vector();
            grav.set(this.orbitee.pos);
            grav.subtractVector(pos);
            var gravAccLen = (POINTS_TIME * this.orbitee.sgp) / grav.getLengthSq();
            grav.setLength(gravAccLen);
            vel.addVector(grav);
            var thrustAcc = this.getThrustForPoint(i);
            thrustAcc.scalarMultiply(POINTS_TIME);
            vel.addVector(thrustAcc);
            var ap;
            for (var _i = 0, _a = this.accelerationPoints; _i < _a.length; _i++) {
                ap = _a[_i];
                if (ap.pointIdx != i)
                    continue;
                if (ap.type == AccType.Redirect) {
                    vel.setRTheta(vel.getLength(), thrustAcc.getAngle());
                }
                break;
            }
            var work = new vector_1.Vector();
            work.set(vel);
            work.scalarMultiply(POINTS_TIME);
            pos.addVector(work);
            if (!this.points[i]) {
                this.points[i] = new vector_1.Vector();
            }
            this.points[i].set(pos);
            if (vector_1.getDistance(this.points[i], this.orbitee.pos) < FATAL_SUN_APPROACH) {
                halt = true;
            }
        }
    };
    Path.prototype.drawSelf = function (sel) {
        var stopIdx = this.getStopPoint();
        var lastX;
        var lastY;
        engine_1.Engine.ctx.strokeStyle = this.color;
        engine_1.Engine.ctx.beginPath();
        for (var i = 0; i <= stopIdx; i++) {
            if (i > this.points.length) {
                break;
            }
            var x = engine_1.Engine.modelToViewX(this.points[i].X);
            var y = engine_1.Engine.modelToViewY(this.points[i].Y);
            if (i > 0) {
                engine_1.Engine.ctx.lineTo(x, y);
            }
            else {
                engine_1.Engine.ctx.moveTo(x, y);
            }
        }
        engine_1.Engine.ctx.stroke();
        var ap;
        for (var _i = 0, _a = this.accelerationPoints; _i < _a.length; _i++) {
            ap = _a[_i];
        }
    };
    Path.prototype.getStopPoint = function () {
        var highestIdx = 0;
        var ap;
        for (var _i = 0, _a = this.accelerationPoints; _i < _a.length; _i++) {
            ap = _a[_i];
            if (ap.type == AccType.StopTrace) {
                return ap.pointIdx;
            }
        }
        return 900 - 1;
    };
    Path.prototype.getNearestPointIdx = function (viewX, viewY) {
        var MAX_DIST = DISPLAY_THRUSTLINE_LENGTH + DISPLAY_THRUSTLINE_LENGTH / 10;
        var MAX_DIST_SQ = MAX_DIST * MAX_DIST;
        var stopIdx = this.getStopPoint();
        var closestIdx = -1;
        var closestDistSq = 0;
        for (var i = 0; i <= stopIdx; i++) {
            var dx = viewX - engine_1.Engine.modelToViewX(this.points[i].X);
            var dy = viewY - engine_1.Engine.modelToViewY(this.points[i].Y);
            var distSq = dx * dx + dy * dy;
            if (distSq < MAX_DIST_SQ) {
                if ((closestIdx == -1) || (distSq < closestDistSq)) {
                    closestDistSq = distSq;
                    closestIdx = i;
                }
            }
        }
        return closestIdx;
    };
    Path.prototype.getNearestAccelPoint = function (viewX, viewY) {
        var MAX_DIST = DISPLAY_THRUSTLINE_LENGTH + DISPLAY_THRUSTLINE_LENGTH / 10;
        var MAX_DIST_SQ = MAX_DIST * MAX_DIST;
        var stopIdx = this.getStopPoint();
        var closestAp;
        var closestDistSq = 0;
        var ap;
        for (var _i = 0, _a = this.accelerationPoints; _i < _a.length; _i++) {
            ap = _a[_i];
            var dx = viewX - engine_1.Engine.modelToViewX(this.points[ap.pointIdx].X);
            var dy = viewY - engine_1.Engine.modelToViewY(this.points[ap.pointIdx].Y);
            var distSq = dx * dx + dy * dy;
            if (distSq < MAX_DIST_SQ) {
                if ((!closestAp) || (distSq < closestDistSq)) {
                    closestDistSq = distSq;
                    closestAp = ap;
                }
            }
        }
        return closestAp;
    };
    return Path;
}());
exports.Path = Path;

},{"./engine":1,"./vector":6}],5:[function(require,module,exports){
Engine = require("./engine").Engine;
$(function() {
  Engine.init($("#canvas"));
  console.log(Engine);
  Engine.drawSelf();
});


},{"./engine":1}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.X = 0;
        this.Y = 0;
        this.X = x;
        this.Y = y;
    }
    Vector.prototype.set = function (v) { this.X = v.X; this.Y = v.Y; };
    Vector.prototype.addVector = function (v) { this.X += v.X; this.Y += v.Y; };
    Vector.prototype.subtractVector = function (v) { this.X -= v.X; this.Y -= v.Y; };
    Vector.prototype.scalarMultiply = function (n) { this.X *= n; this.Y *= n; };
    Vector.prototype.getLengthSq = function () { return this.X * this.X + this.Y * this.Y; };
    Vector.prototype.getLength = function () { return Math.sqrt(this.getLengthSq()); };
    Vector.prototype.setLength = function (n) {
        var len = Math.sqrt(this.getLengthSq());
        this.scalarMultiply(n / len);
    };
    Vector.prototype.rotate = function (ang) {
        _a = [this.X * Math.cos(ang) - this.Y * Math.sin(ang),
            this.X * Math.sin(ang) + this.Y * Math.cos(ang)], this.X = _a[0], this.Y = _a[1];
        var _a;
    };
    Vector.prototype.setRTheta = function (r, theta) {
        _a = [r * Math.cos(theta), r * Math.sin(theta)], this.X = _a[0], this.Y = _a[1];
        var _a;
    };
    Vector.prototype.getAngle = function () { return Math.atan2(this.Y, this.X); };
    return Vector;
}());
exports.Vector = Vector;
function getDistance(a, b) {
    return Math.sqrt((a.X - b.X) * (a.X - b.X) + (a.Y - b.Y) * (a.Y - b.Y));
}
exports.getDistance = getDistance;
function angleDiff(b1Rad, b2Rad) {
    var b1y = Math.cos(b1Rad);
    var b1x = Math.sin(b1Rad);
    var b2y = Math.cos(b2Rad);
    var b2x = Math.sin(b2Rad);
    var crossp = b1y * b2x - b2y * b1x;
    var dotp = b1x * b2x + b1y * b2y;
    if (crossp > 0.)
        return Math.acos(dotp);
    return -Math.acos(dotp);
}
exports.angleDiff = angleDiff;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZW5naW5lLmpzIiwic3JjL29iamVjdC5qcyIsInNyYy9vcmJpdC5qcyIsInNyYy9wYXRoLmpzIiwic3JjL3N0YXJ0LmpzIiwic3JjL3ZlY3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlY3Rvcl8xID0gcmVxdWlyZShcIi4vdmVjdG9yXCIpO1xudmFyIG9iamVjdF8xID0gcmVxdWlyZShcIi4vb2JqZWN0XCIpO1xudmFyIHBhdGhfMSA9IHJlcXVpcmUoXCIuL3BhdGhcIik7XG52YXIgTUFSU19BUE9HRUUgPSAyNDkyMDkzMDAuMDtcbnZhciBTVU5fU0dQID0gMTMyNzEyNDQwMDE4LjA7XG52YXIgTUFSU19BUE9HRUVfVkVMID0gMjEuOTc7XG52YXIgTUFSU19BT1AgPSA0Ljk5OTc7XG52YXIgRUFSVEhfQVBPR0VFID0gMTUyMDk4MjMyLjA7XG52YXIgRUFSVEhfQVBPR0VFX1ZFTCA9IDI5LjM7XG52YXIgRUFSVEhfQU9QID0gMS45OTMzMDtcbnZhciByb290ID0gdGhpcztcbnZhciBQT0lOVFNfVElNRSA9IDg2NDAwLjA7XG52YXIgVUlNb2RlO1xuKGZ1bmN0aW9uIChVSU1vZGUpIHtcbiAgICBVSU1vZGVbVUlNb2RlW1wiTm9ybWFsXCJdID0gMF0gPSBcIk5vcm1hbFwiO1xuICAgIFVJTW9kZVtVSU1vZGVbXCJQbGF5YmFja1wiXSA9IDFdID0gXCJQbGF5YmFja1wiO1xuICAgIFVJTW9kZVtVSU1vZGVbXCJBZGRpbmdQb2ludFwiXSA9IDJdID0gXCJBZGRpbmdQb2ludFwiO1xuICAgIFVJTW9kZVtVSU1vZGVbXCJJbmVydFwiXSA9IDNdID0gXCJJbmVydFwiO1xufSkoVUlNb2RlIHx8IChVSU1vZGUgPSB7fSkpO1xuO1xudmFyIEVuZ2luZVNpbmdsZXRvbiA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFbmdpbmVTaW5nbGV0b24oKSB7XG4gICAgICAgIC8vIFVJIHN0dWZmXG4gICAgICAgIHRoaXMudWlNb2RlID0gVUlNb2RlLk5vcm1hbDtcbiAgICAgICAgdGhpcy5ob3ZlclBhdGhQb2ludElkeCA9IC0xO1xuICAgIH1cbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICB0aGlzLnNjcmVlblcgPSBlbC53aWR0aCgpO1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5IID0gZWwuaGVpZ2h0KCk7XG4gICAgICAgICAgICB0aGlzLmN0eCA9IGVsWzBdLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgICQoZWwpLm9uKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZU1vdmUoZSk7IH0pO1xuICAgICAgICAgICAgJCh3aW5kb3cpLmtleWRvd24oZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmtleURvd24oZSk7IH0pO1xuICAgICAgICAgICAgJCh3aW5kb3cpLmtleXVwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5rZXlVcChlKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNjcmVlblcgPSA2NDA7XG4gICAgICAgICAgICB0aGlzLnNjcmVlbkggPSA0ODA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jZW50ZXIgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciByID0gTUFSU19BUE9HRUUgKiAxLjA1O1xuICAgICAgICB2YXIgd2lkdGggPSByICogMi4wO1xuICAgICAgICB0aGlzLmttUGVyUGl4ZWwgPSAyICogd2lkdGggLyB0aGlzLnNjcmVlblc7XG4gICAgICAgIHZhciBzdW5Qb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciBzdW5WZWwgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuc3VuID0gbmV3IG9iamVjdF8xLk9CT2JqZWN0KFNVTl9TR1AsIHN1blBvcywgc3VuVmVsLCBcIiNmZmZmMDBcIiwgOCwgbnVsbCk7XG4gICAgICAgIHRoaXMubWFycyA9IG5ldyBvYmplY3RfMS5PQk9iamVjdCgwLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKSwgXCIjZmY3ZjdmXCIsIDEsIHRoaXMuc3VuKTtcbiAgICAgICAgdGhpcy5tYXJzLmluaXRPcmJpdGVyKHRoaXMuc3VuLCBNQVJTX0FQT0dFRSwgTUFSU19BUE9HRUVfVkVMLCBNQVJTX0FPUCk7XG4gICAgICAgIHRoaXMuZWFydGggPSBuZXcgb2JqZWN0XzEuT0JPYmplY3QoMCwgbmV3IHZlY3Rvcl8xLlZlY3RvcigpLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIFwiIzdmN2ZmZlwiLCAxLCB0aGlzLnN1bik7XG4gICAgICAgIHRoaXMuZWFydGguaW5pdE9yYml0ZXIodGhpcy5zdW4sIEVBUlRIX0FQT0dFRSwgRUFSVEhfQVBPR0VFX1ZFTCwgRUFSVEhfQU9QKTtcbiAgICAgICAgdGhpcy5tYXJzUGF0aCA9IG5ldyBwYXRoXzEuUGF0aCgpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLm1hcnMsIDUuNDQyOTU3NTUyMik7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoID0gbmV3IHBhdGhfMS5QYXRoKCk7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLmVhcnRoLCA0Ljk3NDU4NzU1MjIpO1xuICAgICAgICB0aGlzLnNoaXAgPSBuZXcgcGF0aF8xLlBhdGgoKTtcbiAgICAgICAgdGhpcy5zaGlwLmluaXQodGhpcy5zdW4sIHRoaXMuZWFydGhQYXRoLnN0YXJ0UG9zLCB0aGlzLmVhcnRoUGF0aC5zdGFydFZlbCwgXCIjN2Y3ZjdmXCIsIDUpO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5tb2RlbFRvVmlld1ggPSBmdW5jdGlvbiAobW9kZWxYKSB7XG4gICAgICAgIHZhciB4ID0gbW9kZWxYIC0gdGhpcy5jZW50ZXIuWDtcbiAgICAgICAgeCAvPSB0aGlzLmttUGVyUGl4ZWw7XG4gICAgICAgIHJldHVybiB4ICsgdGhpcy5zY3JlZW5XIC8gMjtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubW9kZWxUb1ZpZXdZID0gZnVuY3Rpb24gKG1vZGVsWSkge1xuICAgICAgICB2YXIgeSA9IG1vZGVsWSAtIHRoaXMuY2VudGVyLlk7XG4gICAgICAgIHkgLz0gdGhpcy5rbVBlclBpeGVsO1xuICAgICAgICByZXR1cm4geSArIHRoaXMuc2NyZWVuSCAvIDI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgPT0gVUlNb2RlLlBsYXliYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdQbGF5YmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3Tm9ybWFsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd1BsYXliYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5kcmF3Tm9ybWFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmN0eC5jYW52YXMud2lkdGggPSB0aGlzLnNjcmVlblc7XG4gICAgICAgIHRoaXMuY3R4LmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNjcmVlbkg7XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjcmVlblcsIHRoaXMuc2NyZWVuSCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IFwiIzAwMFwiO1xuICAgICAgICB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLnNjcmVlblcsIHRoaXMuc2NyZWVuSCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbygwLCAwKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKDEwMCwgMTAwKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuc3VuLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMubWFyc1BhdGguZHJhd1NlbGYoKTtcbiAgICAgICAgdGhpcy5zaGlwLmRyYXdTZWxmKHRoaXMuaG92ZXJBY2NlbFBvaW50KTtcbiAgICAgICAgaWYgKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gXCIjZmYwMDAwXCI7XG4gICAgICAgICAgICAvLyB0aGlzLnNoaXAuZHJhd1RocnVzdExpbmUodGhpcy5ob3ZlclBhdGhQb2ludElkeCk7XG4gICAgICAgICAgICB2YXIgZGF5bnVtID0gKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggKiA4NjQwMCkgLyBQT0lOVFNfVElNRSArIDE7XG4gICAgICAgICAgICB2YXIgZW0gPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLmVhcnRoUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMubWFyc1BhdGgucG9pbnRzW3RoaXMuaG92ZXJQYXRoUG9pbnRJZHhdKTtcbiAgICAgICAgICAgIHZhciBlaCA9IHZlY3Rvcl8xLmdldERpc3RhbmNlKHRoaXMuZWFydGhQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSwgdGhpcy5zaGlwLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB2YXIgaG0gPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLm1hcnNQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSwgdGhpcy5zaGlwLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSBcIjEycHggQXJpYWxcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRGF5OiBcIiArIGRheW51bS50b0ZpeGVkKDApLCAxMCwgMjApO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJFYXJ0aC1NYXJzOiBcIiArIHRoaXMuZGlzdEluZm8oZW0pLCAxMCwgMzYpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJFYXJ0aC1IZXJtZXM6IFwiICsgdGhpcy5kaXN0SW5mbyhlaCksIDEwLCA1Mik7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChcIkhlcm1lcy1NYXJzOiBcIiArIHRoaXMuZGlzdEluZm8oaG0pLCAxMCwgNjgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZHggPSB0aGlzLmhvdmVyUGF0aFBvaW50SWR4O1xuICAgICAgICBpZiAoaWR4IDwgMSkge1xuICAgICAgICAgICAgaWR4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmVhcnRoLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMuZWFydGhQYXRoLCBpZHgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLm1hcnMuY29sb3I7XG4gICAgICAgIHRoaXMuZHJhd1BhdGhPYmplY3QodGhpcy5tYXJzUGF0aCwgaWR4KTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd1BhdGhPYmplY3QgPSBmdW5jdGlvbiAodG9EcmF3LCBwb2ludElkeCkge1xuICAgICAgICB2YXIgc3RvcFBvaW50ID0gdG9EcmF3LmdldFN0b3BQb2ludCgpO1xuICAgICAgICBpZiAocG9pbnRJZHggPiBzdG9wUG9pbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB4ID0gdGhpcy5tb2RlbFRvVmlld1godG9EcmF3LnBvaW50c1twb2ludElkeF0uWCk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5tb2RlbFRvVmlld1kodG9EcmF3LnBvaW50c1twb2ludElkeF0uWSk7XG4gICAgICAgIGV4cG9ydHMuRW5naW5lLmN0eC5zdHJva2VTdHlsZSA9IFwiI2ZmZlwiO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGV4cG9ydHMuRW5naW5lLmN0eC5hcmMoeCwgeSwgNSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguc3Ryb2tlKCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRpc3RJbmZvID0gZnVuY3Rpb24gKGRpc3QpIHtcbiAgICAgICAgdmFyIGxpZ2h0U2Vjb25kcyA9IGRpc3QgLyAzMDAwMDA7XG4gICAgICAgIHZhciBsaWdodE1pbnV0ZXMgPSBsaWdodFNlY29uZHMgLyA2MDtcbiAgICAgICAgbGlnaHRTZWNvbmRzID0gbGlnaHRTZWNvbmRzICUgNjA7XG4gICAgICAgIHJldHVybiBkaXN0LnRvRml4ZWQoMCkgKyBcImttLCBcIiArIGxpZ2h0TWludXRlcy50b0ZpeGVkKDApICsgXCJtIFwiICsgbGlnaHRTZWNvbmRzLnRvRml4ZWQoMCkgKyBcInNcIjtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSAkKFwiI2NhbnZhc1wiKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgICAgdmFyIHkgPSBldnQuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgPT0gVUlNb2RlLkFkZGluZ1BvaW50KSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RQb2ludElkeCh4LCB5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJBY2NlbFBvaW50ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RBY2NlbFBvaW50KHgsIHkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd1NlbGYoKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUua2V5RG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2dC5rZXk7XG4gICAgICAgIGlmIChrZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmhvdmVyQWNjZWxQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5BZGRpbmdQb2ludDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5rZXlVcCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2dC5rZXk7XG4gICAgICAgIGlmIChrZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmhvdmVyQWNjZWxQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5Ob3JtYWw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBFbmdpbmVTaW5nbGV0b247XG59KCkpO1xuO1xuZXhwb3J0cy5FbmdpbmUgPSBuZXcgRW5naW5lU2luZ2xldG9uKCk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbmdpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgb3JiaXRfMSA9IHJlcXVpcmUoXCIuL29yYml0XCIpO1xudmFyIGVuZ2luZV8xID0gcmVxdWlyZShcIi4vZW5naW5lXCIpO1xudmFyIE9CT2JqZWN0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9CT2JqZWN0KHNncCwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplLCBvcmJpdGVlKSB7XG4gICAgICAgIHRoaXMuc2dwID0gc2dwO1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICAgICAgdGhpcy52ZWwgPSB2ZWw7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5vcmJpdGVlID0gb3JiaXRlZTtcbiAgICB9XG4gICAgT0JPYmplY3QucHJvdG90eXBlLmluaXRPcmJpdGVyID0gZnVuY3Rpb24gKG9yYml0ZWUsIGFwb2dlZURpc3QsIGFwb2dlZVZlbCwgYW9wKSB7XG4gICAgICAgIHRoaXMub3JiaXRlZSA9IG9yYml0ZWU7XG4gICAgICAgIHZhciBhbmdsZU9mQXBvZ2VlID0gYW9wIC0gMy4xNDE1OTtcbiAgICAgICAgdGhpcy5wb3Muc2V0UlRoZXRhKGFwb2dlZURpc3QsIGFuZ2xlT2ZBcG9nZWUpO1xuICAgICAgICB0aGlzLnBvcy5hZGRWZWN0b3Iob3JiaXRlZS5wb3MpO1xuICAgICAgICB0aGlzLnZlbC5zZXQodGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnZlbC5yb3RhdGUoLTMuMTQxNTkgLyAyLjApO1xuICAgICAgICB0aGlzLnZlbC5zZXRMZW5ndGgoYXBvZ2VlVmVsKTtcbiAgICAgICAgdGhpcy5vcmJpdCA9IG5ldyBvcmJpdF8xLk9yYml0KDAsIDAsIDAsIDApO1xuICAgICAgICB0aGlzLm9yYml0LmluaXRQVihvcmJpdGVlLnNncCwgdGhpcy5wb3MsIHRoaXMudmVsKTtcbiAgICAgICAgdGhpcy5vcmJpdC5jb2xvciA9IHRoaXMuY29sb3I7XG4gICAgfTtcbiAgICBPQk9iamVjdC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgICAgIGlmICghdGhpcy5vcmJpdGVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFjYyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3I7XG4gICAgICAgIGFjYy5zZXQodGhpcy5vcmJpdGVlLnBvcyk7XG4gICAgICAgIGFjYy5zdWJ0cmFjdFZlY3Rvcih0aGlzLnBvcyk7XG4gICAgICAgIHZhciBhY2NMZW4gPSAoc2Vjb25kcyAqIHRoaXMub3JiaXRlZS5zZ3ApIC8gYWNjLmdldExlbmd0aFNxKCk7XG4gICAgICAgIGFjYy5zZXRMZW5ndGgoYWNjTGVuKTtcbiAgICAgICAgdGhpcy52ZWwuYWRkVmVjdG9yKGFjYyk7XG4gICAgICAgIHZhciB0b0FkZCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3I7XG4gICAgICAgIHRvQWRkLnNldCh0aGlzLnZlbCk7XG4gICAgICAgIHRvQWRkLnNjYWxhck11bHRpcGx5KHNlY29uZHMpO1xuICAgICAgICB0aGlzLnBvcy5hZGRWZWN0b3IodG9BZGQpO1xuICAgIH07XG4gICAgT0JPYmplY3QucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcmJpdCkge1xuICAgICAgICAgICAgdGhpcy5vcmJpdC5kcmF3U2VsZigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvcy5YKTtcbiAgICAgICAgdmFyIHkgPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9zLlkpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYXJjKHgsIHksIHRoaXMuc2l6ZSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGwoKTtcbiAgICB9O1xuICAgIE9CT2JqZWN0LnByb3RvdHlwZS5yZWNhbGNPcmJpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vcmJpdC5pbml0UFYodGhpcy5vcmJpdC51LCB0aGlzLnBvcywgdGhpcy52ZWwpO1xuICAgIH07XG4gICAgcmV0dXJuIE9CT2JqZWN0O1xufSgpKTtcbmV4cG9ydHMuT0JPYmplY3QgPSBPQk9iamVjdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9iamVjdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBlbmdpbmVfMSA9IHJlcXVpcmUoXCIuL2VuZ2luZVwiKTtcbnZhciBPcmJpdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPcmJpdChzZ3AsIGUsIGEsIHcpIHtcbiAgICAgICAgdGhpcy5pbml0KHNncCwgZSwgYSwgdyk7XG4gICAgfVxuICAgIE9yYml0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHNncCwgZSwgYSwgdykge1xuICAgICAgICB0aGlzLnUgPSBzZ3A7XG4gICAgICAgIHRoaXMuZSA9IGU7XG4gICAgICAgIHRoaXMuYSA9IGE7XG4gICAgICAgIHRoaXMudyA9IHc7XG4gICAgICAgIHRoaXMudmFsaWQgPSBlIDwgMS4wICYmIGEgPiAwLjA7XG4gICAgICAgIHRoaXMuZjEgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuZiA9IHRoaXMuZSAqIHRoaXMuYTtcbiAgICAgICAgdGhpcy5iID0gTWF0aC5zcXJ0KHRoaXMuYSAqIHRoaXMuYSAtIHRoaXMuZiAqIHRoaXMuZik7XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLmNlbnRlci5zZXRSVGhldGEodGhpcy5mLCB0aGlzLncpO1xuICAgICAgICB0aGlzLmYyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLmYyLnNldFJUaGV0YSgyICogdGhpcy5mLCB0aGlzLncpO1xuICAgICAgICB0aGlzLmVuZXJneSA9IC10aGlzLnUgLyAoMi4wICogdGhpcy5hKTtcbiAgICAgICAgdGhpcy5hcG9nZWUgPSB0aGlzLmEgKyB0aGlzLmY7XG4gICAgICAgIHRoaXMucGVyaWdlZSA9IHRoaXMuYSAtIHRoaXMuZjtcbiAgICAgICAgdGhpcy5vcmJpdEFyZWEgPSBNYXRoLlBJICogdGhpcy5hICogdGhpcy5iO1xuICAgICAgICB0aGlzLmNhbGNEcmF3UG9pbnRzKCk7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuaW5pdFBWID0gZnVuY3Rpb24gKHNncCwgb3JiaXRlclBvcywgb3JiaXRlclZlbCkge1xuICAgICAgICB0aGlzLmYxID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLnUgPSBzZ3A7XG4gICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xuICAgICAgICB2YXIgcmVsYXRpdmVQb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHJlbGF0aXZlUG9zLnNldChvcmJpdGVyUG9zKTtcbiAgICAgICAgcmVsYXRpdmVQb3Muc2NhbGFyTXVsdGlwbHkoLTEpO1xuICAgICAgICB2YXIgciA9IHJlbGF0aXZlUG9zLmdldExlbmd0aCgpO1xuICAgICAgICBpZiAociA8PSAwLjApIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9IG9yYml0ZXJWZWwuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIHRoaXMuZW5lcmd5ID0gKHYgKiB2IC8gMi4wKSAtICh0aGlzLnUgLyByKTtcbiAgICAgICAgaWYgKHRoaXMuZW5lcmd5ID49IDAuMCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYSA9IC10aGlzLnUgLyAoMi4wICogdGhpcy5lbmVyZ3kpO1xuICAgICAgICB2YXIgZCA9IDIuMCAqIHRoaXMuYSAtIHI7XG4gICAgICAgIHZhciBvcmJpdGVyQW5nbGUgPSByZWxhdGl2ZVBvcy5nZXRBbmdsZSgpO1xuICAgICAgICB2YXIgdmVsQW5nbGUgPSBvcmJpdGVyVmVsLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciB0aGV0YSA9IHZlY3Rvcl8xLmFuZ2xlRGlmZih2ZWxBbmdsZSwgb3JiaXRlckFuZ2xlKTtcbiAgICAgICAgdmFyIHBoaSA9IE1hdGguUEkgLSB0aGV0YTtcbiAgICAgICAgdGhpcy5mMi5zZXQob3JiaXRlclZlbCk7XG4gICAgICAgIHRoaXMuZjIuc2V0TGVuZ3RoKGQpO1xuICAgICAgICB0aGlzLmYyLnJvdGF0ZShwaGkpO1xuICAgICAgICB0aGlzLmYyLmFkZFZlY3RvcihvcmJpdGVyUG9zKTtcbiAgICAgICAgdGhpcy53ID0gdGhpcy5mMi5nZXRBbmdsZSgpO1xuICAgICAgICB0aGlzLmYgPSB0aGlzLmYyLmdldExlbmd0aCgpIC8gMjtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5mIC8gdGhpcy5hO1xuICAgICAgICB0aGlzLmluaXQoc2dwLCB0aGlzLmUsIHRoaXMuYSwgdGhpcy53KTtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5jYWxjRHJhd1BvaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhTdGVwID0gMi4wICogZW5naW5lXzEuRW5naW5lLmttUGVyUGl4ZWw7XG4gICAgICAgIHZhciBudW1Qb2ludHMgPSBNYXRoLnJvdW5kKCgyLjAgKiB0aGlzLmEpIC8geFN0ZXApICsgMjsgLy8gdGhlICsyIGlzIGZvciByb3VuZGluZyBzYWZldHlcbiAgICAgICAgdmFyIG1heERyYXdQb2ludHMgPSBudW1Qb2ludHMgKiAyO1xuICAgICAgICB0aGlzLmRyYXdQb2ludHMgPSBbXTtcbiAgICAgICAgdmFyIGZpcnN0SGFsZiA9IFtdO1xuICAgICAgICB2YXIgc2Vjb25kSGFsZiA9IFtdO1xuICAgICAgICB2YXIgaGFsZlBvcyA9IDA7XG4gICAgICAgIHZhciB4ID0gLXRoaXMuYTtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBhbHBoYSA9IDEuMCAtICh4ICogeCkgLyAodGhpcy5hICogdGhpcy5hKTtcbiAgICAgICAgICAgIHZhciB5ID0gTWF0aC5zcXJ0KHRoaXMuYiAqIHRoaXMuYiAqIGFscGhhKTtcbiAgICAgICAgICAgIGlmIChoYWxmUG9zID49IG51bVBvaW50cykge1xuICAgICAgICAgICAgICAgIHRocm93IFwiT29wc1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdvcmsgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKHgsIHkpO1xuICAgICAgICAgICAgd29yay5yb3RhdGUodGhpcy53KTtcbiAgICAgICAgICAgIHdvcmsuYWRkVmVjdG9yKHRoaXMuY2VudGVyKTtcbiAgICAgICAgICAgIGZpcnN0SGFsZltoYWxmUG9zXSA9IHtcbiAgICAgICAgICAgICAgICBYOiBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHdvcmsuWCksXG4gICAgICAgICAgICAgICAgWTogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh3b3JrLlkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd29yayA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoeCwgLXkpO1xuICAgICAgICAgICAgd29yay5yb3RhdGUodGhpcy53KTtcbiAgICAgICAgICAgIHdvcmsuYWRkVmVjdG9yKHRoaXMuY2VudGVyKTtcbiAgICAgICAgICAgIHNlY29uZEhhbGZbaGFsZlBvc10gPSB7XG4gICAgICAgICAgICAgICAgWDogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh3b3JrLlgpLFxuICAgICAgICAgICAgICAgIFk6IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kod29yay5ZKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbGZQb3MrKztcbiAgICAgICAgICAgIGlmICh4ID09IHRoaXMuYSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeCArPSB4U3RlcDtcbiAgICAgICAgICAgIGlmICh4ID4gdGhpcy5hKSB7XG4gICAgICAgICAgICAgICAgeCA9IHRoaXMuYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRyYXdQb2ludHMgPSBmaXJzdEhhbGY7XG4gICAgICAgIHRoaXMuZHJhd1BvaW50cy5wdXNoLmFwcGx5KHNlY29uZEhhbGYucmV2ZXJzZSgpKTtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkIHx8ICF0aGlzLmRyYXdQb2ludHMgfHwgdGhpcy5kcmF3UG9pbnRzLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBfYSA9IHRoaXMuZHJhd1BvaW50c1swXSwgbGFzdFggPSBfYS5YLCBsYXN0WSA9IF9hLlk7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2IgPSB0aGlzLmRyYXdQb2ludHM7IF9pIDwgX2IubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF9iW19pXTtcbiAgICAgICAgICAgIHZhciB0aGlzWCA9IHAuWCwgdGhpc1kgPSBwLlk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxpbmUgKFwiICsgbGFzdFggKyBcIiwgXCIgKyBsYXN0WSArIFwiKS0oXCIgKyB0aGlzWCArIFwiLCBcIiArIHRoaXNZICsgXCIpXCIpO1xuICAgICAgICAgICAgX2MgPSBbdGhpc1gsIHRoaXNZXSwgbGFzdFggPSBfY1swXSwgbGFzdFkgPSBfY1sxXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2M7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuZ2V0UiA9IGZ1bmN0aW9uICh0aGV0YSkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBudW1lcmF0b3IgPSB0aGlzLmEgKiAoMS4wIC0gdGhpcy5lICogdGhpcy5lKTtcbiAgICAgICAgdmFyIGRlbm9taW5hdG9yID0gMS4wIC0gdGhpcy5lICogKE1hdGguY29zKHRoZXRhIC0gdGhpcy53KSk7XG4gICAgICAgIHJldHVybiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5nZXRQb3MgPSBmdW5jdGlvbiAodGhldGEpIHtcbiAgICAgICAgdmFyIHBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdmFyIHIgPSB0aGlzLmdldFIodGhldGEpO1xuICAgICAgICBwb3Muc2V0UlRoZXRhKHIsIHRoZXRhKTtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5nZXRWZWwgPSBmdW5jdGlvbiAodGhldGEpIHtcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMuZ2V0UG9zKHRoZXRhKTtcbiAgICAgICAgdmFyIHIgPSBwb3MuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIHZhciB2U3F1YXJlZCA9IDIuMCAqICh0aGlzLmVuZXJneSArIHRoaXMudSAvIHIpO1xuICAgICAgICB2YXIgdiA9IE1hdGguc3FydCh2U3F1YXJlZCk7XG4gICAgICAgIHZhciBhbmdsZVRvRjEgPSBNYXRoLlBJICsgdGhldGE7XG4gICAgICAgIHZhciBsb29rQXRGMiA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgbG9va0F0RjIuc2V0KHRoaXMuZjIpO1xuICAgICAgICBsb29rQXRGMi5zdWJ0cmFjdFZlY3Rvcihwb3MpO1xuICAgICAgICB2YXIgYW5nbGVUb0YyID0gbG9va0F0RjIuZ2V0QW5nbGUoKTtcbiAgICAgICAgdmFyIGRpZmYgPSB2ZWN0b3JfMS5hbmdsZURpZmYoYW5nbGVUb0YxLCBhbmdsZVRvRjIpO1xuICAgICAgICB2YXIgYW5nbGUgPSBhbmdsZVRvRjEgKyBkaWZmIC8gMi4wO1xuICAgICAgICB2YXIgdmVsQW5nbGUgPSBhbmdsZSArIChNYXRoLlBJIC8gMi4wKTtcbiAgICAgICAgdmFyIG91dCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgb3V0LnNldFJUaGV0YSh2LCB2ZWxBbmdsZSk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gT3JiaXQ7XG59KCkpO1xuZXhwb3J0cy5PcmJpdCA9IE9yYml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JiaXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgZW5naW5lXzEgPSByZXF1aXJlKFwiLi9lbmdpbmVcIik7XG52YXIgQWNjVHlwZTtcbihmdW5jdGlvbiAoQWNjVHlwZSkge1xuICAgIEFjY1R5cGVbQWNjVHlwZVtcIk5vcm1hbFwiXSA9IDBdID0gXCJOb3JtYWxcIjtcbiAgICBBY2NUeXBlW0FjY1R5cGVbXCJSZWRpcmVjdFwiXSA9IDFdID0gXCJSZWRpcmVjdFwiO1xuICAgIEFjY1R5cGVbQWNjVHlwZVtcIlN0b3BUcmFjZVwiXSA9IDJdID0gXCJTdG9wVHJhY2VcIjtcbn0pKEFjY1R5cGUgfHwgKEFjY1R5cGUgPSB7fSkpO1xuO1xuO1xudmFyIFBBVEhfQUNDRUxFUkFUSU9OID0gMC4wMDAwMDI7XG52YXIgUE9JTlRTX1RJTUUgPSA4NjQwMC4wO1xudmFyIEZBVEFMX1NVTl9BUFBST0FDSCA9IDM1MDAwMDAwLjA7XG52YXIgRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCA9IDUwO1xudmFyIFBhdGggPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGF0aCgpIHtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5wb2ludHMgPSBbXTtcbiAgICB9XG4gICAgUGF0aC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChvcmJpdGVlLCBwb3MsIHZlbCwgY29sb3IsIHNpemUpIHtcbiAgICAgICAgdGhpcy5pbml0Tm9BY2Mob3JiaXRlZSwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplKTtcbiAgICAgICAgdmFyIG5ld1BvaW50ID0gdGhpcy5jcmVhdGVBY2NlbGVyYXRpb25Qb2ludCgwKTtcbiAgICAgICAgbmV3UG9pbnQuYW5nbGUgPSBNYXRoLlBJIC8gMi4wO1xuICAgICAgICBuZXdQb2ludC5tYWcgPSBQQVRIX0FDQ0VMRVJBVElPTjtcbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5pbml0Tm9BY2MgPSBmdW5jdGlvbiAob3JiaXRlZSwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5vcmJpdGVlID0gb3JiaXRlZTtcbiAgICAgICAgdGhpcy5zdGFydFBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5zdGFydFBvcy5zZXQocG9zKTtcbiAgICAgICAgdGhpcy5zdGFydFZlbCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5zdGFydFZlbC5zZXQodmVsKTtcbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5pbml0Tm9BY2NPcmJpdGVyQW5nbGUgPSBmdW5jdGlvbiAob3JiaXRlciwgYW5nbGUpIHtcbiAgICAgICAgYW5nbGUgPSAtTWF0aC5QSSAvIDIuMCAtIGFuZ2xlO1xuICAgICAgICB2YXIgb3JiaXRlZSA9IG9yYml0ZXIub3JiaXRlZTtcbiAgICAgICAgdmFyIHBvcyA9IG9yYml0ZXIub3JiaXQuZ2V0UG9zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHZlbCA9IG9yYml0ZXIub3JiaXQuZ2V0VmVsKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdE5vQWNjKG9yYml0ZWUsIHBvcywgdmVsLCBvcmJpdGVyLm9yYml0LmNvbG9yLCBvcmJpdGVyLnNpemUpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUucmVtb3ZlQWNjZWxlcmF0aW9uUG9pbnQgPSBmdW5jdGlvbiAoYXApIHtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5maWx0ZXIoZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICE9PSBhcDsgfSk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5hZGp1c3RBY2NlbGVyYXRpb25Qb2ludCA9IGZ1bmN0aW9uIChhcCwgbXgsIG15LCBuZXdNYWcpIHtcbiAgICAgICAgdmFyIHBvaW50SWR4ID0gYXAucG9pbnRJZHg7XG4gICAgICAgIHZhciBhcFggPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW3BvaW50SWR4XS5YKTtcbiAgICAgICAgdmFyIGFwWSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbcG9pbnRJZHhdLlkpO1xuICAgICAgICB2YXIgbmV3TGluZSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IobXggLSBhcFgsIG15IC0gYXBZKTtcbiAgICAgICAgdmFyIHVuYWRqdXN0ZWRBbmcgPSBuZXdMaW5lLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciBncmF2ID0gdGhpcy5nZXRHcmF2Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICB2YXIgZ3JhdkFuZyA9IGdyYXYuZ2V0QW5nbGUoKTtcbiAgICAgICAgYXAuYW5nbGUgPSB2ZWN0b3JfMS5hbmdsZURpZmYoZ3JhdkFuZywgdW5hZGp1c3RlZEFuZyk7XG4gICAgICAgIGFwLm1hZyA9IG5ld01hZztcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldEdyYXZGb3JQb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICByZXN1bHQuc2V0KHRoaXMub3JiaXRlZS5wb3MpO1xuICAgICAgICBpZiAocG9pbnRJZHggPT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnN1YnRyYWN0VmVjdG9yKHRoaXMuc3RhcnRQb3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnN1YnRyYWN0VmVjdG9yKHRoaXMucG9pbnRzW3BvaW50SWR4IC0gMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5jcmVhdGVBY2NlbGVyYXRpb25Qb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICB2YXIgYXAgPSB7IHBvaW50SWR4OiBwb2ludElkeCB9O1xuICAgICAgICBpZiAodGhpcy5hY2NlbGVyYXRpb25Qb2ludHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHRocnVzdCA9IHRoaXMuZ2V0VGhydXN0Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICAgICAgYXAubWFnID0gdGhydXN0LmdldExlbmd0aCgpO1xuICAgICAgICAgICAgdmFyIGdyYXYgPSB0aGlzLmdldEdyYXZGb3JQb2ludChwb2ludElkeCk7XG4gICAgICAgICAgICBhcC5hbmdsZSA9IHZlY3Rvcl8xLmFuZ2xlRGlmZihncmF2LmdldEFuZ2xlKCksIHRocnVzdC5nZXRBbmdsZSgpKTtcbiAgICAgICAgfVxuICAgICAgICBhcC50eXBlID0gQWNjVHlwZS5Ob3JtYWw7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLnB1c2goYXApO1xuICAgICAgICByZXR1cm4gYXA7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5nZXRUaHJ1c3RGb3JQb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICBpZiAodGhpcy5hY2NlbGVyYXRpb25Qb2ludHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JhdiA9IHRoaXMuZ2V0R3JhdkZvclBvaW50KHBvaW50SWR4KTtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGhpc0FwID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKHRoaXNBcC5wb2ludElkeCA+IHBvaW50SWR4KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcCA9IHRoaXNBcDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFwKSB7XG4gICAgICAgICAgICBhcCA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzW3RoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhY2MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIGFjYy5zZXQoZ3Jhdik7XG4gICAgICAgIGFjYy5yb3RhdGUoYXAuYW5nbGUpO1xuICAgICAgICBhY2Muc2V0TGVuZ3RoKGFwLm1hZyk7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5jYWxjUG9pbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICBwb3Muc2V0KHRoaXMuc3RhcnRQb3MpO1xuICAgICAgICB2YXIgdmVsID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2ZWwuc2V0KHRoaXMuc3RhcnRWZWwpO1xuICAgICAgICB2YXIgc3RvcElkeCA9IHRoaXMuZ2V0U3RvcFBvaW50KCk7XG4gICAgICAgIGlmICghdGhpcy5wb2ludHNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMucG9pbnRzWzBdID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9pbnRzWzBdLnNldChwb3MpO1xuICAgICAgICB2YXIgaGFsdCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdG9wSWR4OyBpKyspIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5wb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpXSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludHNbaV0uc2V0KHRoaXMucG9pbnRzW2kgLSAxXSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZ3JhdiA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIGdyYXYuc2V0KHRoaXMub3JiaXRlZS5wb3MpO1xuICAgICAgICAgICAgZ3Jhdi5zdWJ0cmFjdFZlY3Rvcihwb3MpO1xuICAgICAgICAgICAgdmFyIGdyYXZBY2NMZW4gPSAoUE9JTlRTX1RJTUUgKiB0aGlzLm9yYml0ZWUuc2dwKSAvIGdyYXYuZ2V0TGVuZ3RoU3EoKTtcbiAgICAgICAgICAgIGdyYXYuc2V0TGVuZ3RoKGdyYXZBY2NMZW4pO1xuICAgICAgICAgICAgdmVsLmFkZFZlY3RvcihncmF2KTtcbiAgICAgICAgICAgIHZhciB0aHJ1c3RBY2MgPSB0aGlzLmdldFRocnVzdEZvclBvaW50KGkpO1xuICAgICAgICAgICAgdGhydXN0QWNjLnNjYWxhck11bHRpcGx5KFBPSU5UU19USU1FKTtcbiAgICAgICAgICAgIHZlbC5hZGRWZWN0b3IodGhydXN0QWNjKTtcbiAgICAgICAgICAgIHZhciBhcDtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICBpZiAoYXAucG9pbnRJZHggIT0gaSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKGFwLnR5cGUgPT0gQWNjVHlwZS5SZWRpcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICB2ZWwuc2V0UlRoZXRhKHZlbC5nZXRMZW5ndGgoKSwgdGhydXN0QWNjLmdldEFuZ2xlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JrID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICAgICAgd29yay5zZXQodmVsKTtcbiAgICAgICAgICAgIHdvcmsuc2NhbGFyTXVsdGlwbHkoUE9JTlRTX1RJTUUpO1xuICAgICAgICAgICAgcG9zLmFkZFZlY3Rvcih3b3JrKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5wb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpXSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucG9pbnRzW2ldLnNldChwb3MpO1xuICAgICAgICAgICAgaWYgKHZlY3Rvcl8xLmdldERpc3RhbmNlKHRoaXMucG9pbnRzW2ldLCB0aGlzLm9yYml0ZWUucG9zKSA8IEZBVEFMX1NVTl9BUFBST0FDSCkge1xuICAgICAgICAgICAgICAgIGhhbHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uIChzZWwpIHtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgbGFzdFg7XG4gICAgICAgIHZhciBsYXN0WTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiB0aGlzLnBvaW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1tpXS5YKTtcbiAgICAgICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1tpXS5ZKTtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0U3RvcFBvaW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGlnaGVzdElkeCA9IDA7XG4gICAgICAgIHZhciBhcDtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXAgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAoYXAudHlwZSA9PSBBY2NUeXBlLlN0b3BUcmFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcC5wb2ludElkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gOTAwIC0gMTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldE5lYXJlc3RQb2ludElkeCA9IGZ1bmN0aW9uICh2aWV3WCwgdmlld1kpIHtcbiAgICAgICAgdmFyIE1BWF9ESVNUID0gRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCArIERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggLyAxMDtcbiAgICAgICAgdmFyIE1BWF9ESVNUX1NRID0gTUFYX0RJU1QgKiBNQVhfRElTVDtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgY2xvc2VzdElkeCA9IC0xO1xuICAgICAgICB2YXIgY2xvc2VzdERpc3RTcSA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2ldLlgpO1xuICAgICAgICAgICAgdmFyIGR5ID0gdmlld1kgLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW2ldLlkpO1xuICAgICAgICAgICAgdmFyIGRpc3RTcSA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgICAgICAgaWYgKGRpc3RTcSA8IE1BWF9ESVNUX1NRKSB7XG4gICAgICAgICAgICAgICAgaWYgKChjbG9zZXN0SWR4ID09IC0xKSB8fCAoZGlzdFNxIDwgY2xvc2VzdERpc3RTcSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3RTcSA9IGRpc3RTcTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdElkeCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXN0SWR4O1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0TmVhcmVzdEFjY2VsUG9pbnQgPSBmdW5jdGlvbiAodmlld1gsIHZpZXdZKSB7XG4gICAgICAgIHZhciBNQVhfRElTVCA9IERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggKyBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIIC8gMTA7XG4gICAgICAgIHZhciBNQVhfRElTVF9TUSA9IE1BWF9ESVNUICogTUFYX0RJU1Q7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgdmFyIGNsb3Nlc3RBcDtcbiAgICAgICAgdmFyIGNsb3Nlc3REaXN0U3EgPSAwO1xuICAgICAgICB2YXIgYXA7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFwID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2FwLnBvaW50SWR4XS5YKTtcbiAgICAgICAgICAgIHZhciBkeSA9IHZpZXdZIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1thcC5wb2ludElkeF0uWSk7XG4gICAgICAgICAgICB2YXIgZGlzdFNxID0gZHggKiBkeCArIGR5ICogZHk7XG4gICAgICAgICAgICBpZiAoZGlzdFNxIDwgTUFYX0RJU1RfU1EpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCFjbG9zZXN0QXApIHx8IChkaXN0U3EgPCBjbG9zZXN0RGlzdFNxKSkge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0RGlzdFNxID0gZGlzdFNxO1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0QXAgPSBhcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3Nlc3RBcDtcbiAgICB9O1xuICAgIHJldHVybiBQYXRoO1xufSgpKTtcbmV4cG9ydHMuUGF0aCA9IFBhdGg7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXRoLmpzLm1hcCIsIkVuZ2luZSA9IHJlcXVpcmUoXCIuL2VuZ2luZVwiKS5FbmdpbmU7XG4kKGZ1bmN0aW9uKCkge1xuICBFbmdpbmUuaW5pdCgkKFwiI2NhbnZhc1wiKSk7XG4gIGNvbnNvbGUubG9nKEVuZ2luZSk7XG4gIEVuZ2luZS5kcmF3U2VsZigpO1xufSk7XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFZlY3RvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWZWN0b3IoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IDA7IH1cbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgICAgdGhpcy5YID0geDtcbiAgICAgICAgdGhpcy5ZID0geTtcbiAgICB9XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodikgeyB0aGlzLlggPSB2Llg7IHRoaXMuWSA9IHYuWTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCArPSB2Llg7IHRoaXMuWSArPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCAtPSB2Llg7IHRoaXMuWSAtPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJNdWx0aXBseSA9IGZ1bmN0aW9uIChuKSB7IHRoaXMuWCAqPSBuOyB0aGlzLlkgKj0gbjsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmdldExlbmd0aFNxID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5YICogdGhpcy5YICsgdGhpcy5ZICogdGhpcy5ZOyB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRMZW5ndGggPSBmdW5jdGlvbiAobikge1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7XG4gICAgICAgIHRoaXMuc2NhbGFyTXVsdGlwbHkobiAvIGxlbik7XG4gICAgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmcpIHtcbiAgICAgICAgX2EgPSBbdGhpcy5YICogTWF0aC5jb3MoYW5nKSAtIHRoaXMuWSAqIE1hdGguc2luKGFuZyksXG4gICAgICAgICAgICB0aGlzLlggKiBNYXRoLnNpbihhbmcpICsgdGhpcy5ZICogTWF0aC5jb3MoYW5nKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRSVGhldGEgPSBmdW5jdGlvbiAociwgdGhldGEpIHtcbiAgICAgICAgX2EgPSBbciAqIE1hdGguY29zKHRoZXRhKSwgciAqIE1hdGguc2luKHRoZXRhKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5nZXRBbmdsZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1hdGguYXRhbjIodGhpcy5ZLCB0aGlzLlgpOyB9O1xuICAgIHJldHVybiBWZWN0b3I7XG59KCkpO1xuZXhwb3J0cy5WZWN0b3IgPSBWZWN0b3I7XG5mdW5jdGlvbiBnZXREaXN0YW5jZShhLCBiKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCgoYS5YIC0gYi5YKSAqIChhLlggLSBiLlgpICsgKGEuWSAtIGIuWSkgKiAoYS5ZIC0gYi5ZKSk7XG59XG5leHBvcnRzLmdldERpc3RhbmNlID0gZ2V0RGlzdGFuY2U7XG5mdW5jdGlvbiBhbmdsZURpZmYoYjFSYWQsIGIyUmFkKSB7XG4gICAgdmFyIGIxeSA9IE1hdGguY29zKGIxUmFkKTtcbiAgICB2YXIgYjF4ID0gTWF0aC5zaW4oYjFSYWQpO1xuICAgIHZhciBiMnkgPSBNYXRoLmNvcyhiMlJhZCk7XG4gICAgdmFyIGIyeCA9IE1hdGguc2luKGIyUmFkKTtcbiAgICB2YXIgY3Jvc3NwID0gYjF5ICogYjJ4IC0gYjJ5ICogYjF4O1xuICAgIHZhciBkb3RwID0gYjF4ICogYjJ4ICsgYjF5ICogYjJ5O1xuICAgIGlmIChjcm9zc3AgPiAwLilcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhkb3RwKTtcbiAgICByZXR1cm4gLU1hdGguYWNvcyhkb3RwKTtcbn1cbmV4cG9ydHMuYW5nbGVEaWZmID0gYW5nbGVEaWZmO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjdG9yLmpzLm1hcCJdfQ==
