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
    EngineSingleton.prototype.load = function (url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        var that = this;
        xhr.onload = function (e) {
            // response is unsigned 8 bit integer
            var dv = new DataView(this.response);
            var off = 0;
            off = that.earthPath.load(dv, off);
            off = that.marsPath.load(dv, off);
            off = that.ship.load(dv, off);
            that.drawSelf();
        };
        xhr.send();
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
    Path.prototype.load = function (dv, off) {
        this.startPos.X = dv.getFloat64(off, true);
        off += 8;
        this.startPos.Y = dv.getFloat64(off, true);
        off += 8;
        this.startVel.X = dv.getFloat64(off, true);
        off += 8;
        this.startVel.Y = dv.getFloat64(off, true);
        off += 8;
        this.accelerationPoints = [];
        var numPoints = dv.getInt32(off);
        off += 4;
        for (var i = 0; i < numPoints; i++) {
            var ap = {};
            ap.pointIdx = dv.getInt32(off);
            off += 4;
            ap.type = dv.getInt32(off);
            off += 4;
            ap.angle = dv.getFloat64(off, true);
            off += 8;
            ap.mag = dv.getFloat64(off, true);
            off += 8;
            this.accelerationPoints.push(ap);
        }
        this.calcPoints();
        return off;
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
  $("#original").click(function() { Engine.load("original.sav"); })
  $("#sol6abort").click(function() { Engine.load("sol6abort.sav"); })
  $("#final").click(function() { Engine.load("final.sav"); })
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZW5naW5lLmpzIiwic3JjL29iamVjdC5qcyIsInNyYy9vcmJpdC5qcyIsInNyYy9wYXRoLmpzIiwic3JjL3N0YXJ0LmpzIiwic3JjL3ZlY3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBvYmplY3RfMSA9IHJlcXVpcmUoXCIuL29iamVjdFwiKTtcbnZhciBwYXRoXzEgPSByZXF1aXJlKFwiLi9wYXRoXCIpO1xudmFyIE1BUlNfQVBPR0VFID0gMjQ5MjA5MzAwLjA7XG52YXIgU1VOX1NHUCA9IDEzMjcxMjQ0MDAxOC4wO1xudmFyIE1BUlNfQVBPR0VFX1ZFTCA9IDIxLjk3O1xudmFyIE1BUlNfQU9QID0gNC45OTk3O1xudmFyIEVBUlRIX0FQT0dFRSA9IDE1MjA5ODIzMi4wO1xudmFyIEVBUlRIX0FQT0dFRV9WRUwgPSAyOS4zO1xudmFyIEVBUlRIX0FPUCA9IDEuOTkzMzA7XG52YXIgcm9vdCA9IHRoaXM7XG52YXIgUE9JTlRTX1RJTUUgPSA4NjQwMC4wO1xudmFyIFVJTW9kZTtcbihmdW5jdGlvbiAoVUlNb2RlKSB7XG4gICAgVUlNb2RlW1VJTW9kZVtcIk5vcm1hbFwiXSA9IDBdID0gXCJOb3JtYWxcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiUGxheWJhY2tcIl0gPSAxXSA9IFwiUGxheWJhY2tcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiQWRkaW5nUG9pbnRcIl0gPSAyXSA9IFwiQWRkaW5nUG9pbnRcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiSW5lcnRcIl0gPSAzXSA9IFwiSW5lcnRcIjtcbn0pKFVJTW9kZSB8fCAoVUlNb2RlID0ge30pKTtcbjtcbnZhciBFbmdpbmVTaW5nbGV0b24gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW5naW5lU2luZ2xldG9uKCkge1xuICAgICAgICAvLyBVSSBzdHVmZlxuICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5Ob3JtYWw7XG4gICAgICAgIHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggPSAtMTtcbiAgICB9XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5XID0gZWwud2lkdGgoKTtcbiAgICAgICAgICAgIHRoaXMuc2NyZWVuSCA9IGVsLmhlaWdodCgpO1xuICAgICAgICAgICAgdGhpcy5jdHggPSBlbFswXS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICAkKGVsKS5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VNb3ZlKGUpOyB9KTtcbiAgICAgICAgICAgICQod2luZG93KS5rZXlkb3duKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5rZXlEb3duKGUpOyB9KTtcbiAgICAgICAgICAgICQod2luZG93KS5rZXl1cChmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMua2V5VXAoZSk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5XID0gNjQwO1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5IID0gNDgwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2YXIgciA9IE1BUlNfQVBPR0VFICogMS4wNTtcbiAgICAgICAgdmFyIHdpZHRoID0gciAqIDIuMDtcbiAgICAgICAgdGhpcy5rbVBlclBpeGVsID0gMiAqIHdpZHRoIC8gdGhpcy5zY3JlZW5XO1xuICAgICAgICB2YXIgc3VuUG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2YXIgc3VuVmVsID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLnN1biA9IG5ldyBvYmplY3RfMS5PQk9iamVjdChTVU5fU0dQLCBzdW5Qb3MsIHN1blZlbCwgXCIjZmZmZjAwXCIsIDgsIG51bGwpO1xuICAgICAgICB0aGlzLm1hcnMgPSBuZXcgb2JqZWN0XzEuT0JPYmplY3QoMCwgbmV3IHZlY3Rvcl8xLlZlY3RvcigpLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIFwiI2ZmN2Y3ZlwiLCAxLCB0aGlzLnN1bik7XG4gICAgICAgIHRoaXMubWFycy5pbml0T3JiaXRlcih0aGlzLnN1biwgTUFSU19BUE9HRUUsIE1BUlNfQVBPR0VFX1ZFTCwgTUFSU19BT1ApO1xuICAgICAgICB0aGlzLmVhcnRoID0gbmV3IG9iamVjdF8xLk9CT2JqZWN0KDAsIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKSwgbmV3IHZlY3Rvcl8xLlZlY3RvcigpLCBcIiM3ZjdmZmZcIiwgMSwgdGhpcy5zdW4pO1xuICAgICAgICB0aGlzLmVhcnRoLmluaXRPcmJpdGVyKHRoaXMuc3VuLCBFQVJUSF9BUE9HRUUsIEVBUlRIX0FQT0dFRV9WRUwsIEVBUlRIX0FPUCk7XG4gICAgICAgIHRoaXMubWFyc1BhdGggPSBuZXcgcGF0aF8xLlBhdGgoKTtcbiAgICAgICAgdGhpcy5tYXJzUGF0aC5pbml0Tm9BY2NPcmJpdGVyQW5nbGUodGhpcy5tYXJzLCA1LjQ0Mjk1NzU1MjIpO1xuICAgICAgICB0aGlzLmVhcnRoUGF0aCA9IG5ldyBwYXRoXzEuUGF0aCgpO1xuICAgICAgICB0aGlzLmVhcnRoUGF0aC5pbml0Tm9BY2NPcmJpdGVyQW5nbGUodGhpcy5lYXJ0aCwgNC45NzQ1ODc1NTIyKTtcbiAgICAgICAgdGhpcy5zaGlwID0gbmV3IHBhdGhfMS5QYXRoKCk7XG4gICAgICAgIHRoaXMuc2hpcC5pbml0KHRoaXMuc3VuLCB0aGlzLmVhcnRoUGF0aC5zdGFydFBvcywgdGhpcy5lYXJ0aFBhdGguc3RhcnRWZWwsIFwiIzdmN2Y3ZlwiLCA1KTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubW9kZWxUb1ZpZXdYID0gZnVuY3Rpb24gKG1vZGVsWCkge1xuICAgICAgICB2YXIgeCA9IG1vZGVsWCAtIHRoaXMuY2VudGVyLlg7XG4gICAgICAgIHggLz0gdGhpcy5rbVBlclBpeGVsO1xuICAgICAgICByZXR1cm4geCArIHRoaXMuc2NyZWVuVyAvIDI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLm1vZGVsVG9WaWV3WSA9IGZ1bmN0aW9uIChtb2RlbFkpIHtcbiAgICAgICAgdmFyIHkgPSBtb2RlbFkgLSB0aGlzLmNlbnRlci5ZO1xuICAgICAgICB5IC89IHRoaXMua21QZXJQaXhlbDtcbiAgICAgICAgcmV0dXJuIHkgKyB0aGlzLnNjcmVlbkggLyAyO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudWlNb2RlID09IFVJTW9kZS5QbGF5YmFjaykge1xuICAgICAgICAgICAgdGhpcy5kcmF3UGxheWJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd05vcm1hbCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdQbGF5YmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd05vcm1hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jdHguY2FudmFzLndpZHRoID0gdGhpcy5zY3JlZW5XO1xuICAgICAgICB0aGlzLmN0eC5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zY3JlZW5IO1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiMwMDBcIjtcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oMCwgMCk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbygxMDAsIDEwMCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLnN1bi5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLmVhcnRoUGF0aC5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMuc2hpcC5kcmF3U2VsZih0aGlzLmhvdmVyQWNjZWxQb2ludCk7XG4gICAgICAgIGlmICh0aGlzLmhvdmVyUGF0aFBvaW50SWR4ICE9IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IFwiI2ZmMDAwMFwiO1xuICAgICAgICAgICAgLy8gdGhpcy5zaGlwLmRyYXdUaHJ1c3RMaW5lKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHgpO1xuICAgICAgICAgICAgdmFyIGRheW51bSA9ICh0aGlzLmhvdmVyUGF0aFBvaW50SWR4ICogODY0MDApIC8gUE9JTlRTX1RJTUUgKyAxO1xuICAgICAgICAgICAgdmFyIGVtID0gdmVjdG9yXzEuZ2V0RGlzdGFuY2UodGhpcy5lYXJ0aFBhdGgucG9pbnRzW3RoaXMuaG92ZXJQYXRoUG9pbnRJZHhdLCB0aGlzLm1hcnNQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB2YXIgZWggPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLmVhcnRoUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMuc2hpcC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0pO1xuICAgICAgICAgICAgdmFyIGhtID0gdmVjdG9yXzEuZ2V0RGlzdGFuY2UodGhpcy5tYXJzUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMuc2hpcC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0pO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gXCIjZmZmZmZmXCI7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gXCIxMnB4IEFyaWFsXCI7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChcIkRheTogXCIgKyBkYXludW0udG9GaXhlZCgwKSwgMTAsIDIwKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRWFydGgtTWFyczogXCIgKyB0aGlzLmRpc3RJbmZvKGVtKSwgMTAsIDM2KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRWFydGgtSGVybWVzOiBcIiArIHRoaXMuZGlzdEluZm8oZWgpLCAxMCwgNTIpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJIZXJtZXMtTWFyczogXCIgKyB0aGlzLmRpc3RJbmZvKGhtKSwgMTAsIDY4KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWR4ID0gdGhpcy5ob3ZlclBhdGhQb2ludElkeDtcbiAgICAgICAgaWYgKGlkeCA8IDEpIHtcbiAgICAgICAgICAgIGlkeCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5lYXJ0aC5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLmVhcnRoUGF0aCwgaWR4KTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5tYXJzLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMubWFyc1BhdGgsIGlkeCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdQYXRoT2JqZWN0ID0gZnVuY3Rpb24gKHRvRHJhdywgcG9pbnRJZHgpIHtcbiAgICAgICAgdmFyIHN0b3BQb2ludCA9IHRvRHJhdy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgaWYgKHBvaW50SWR4ID4gc3RvcFBvaW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgeCA9IHRoaXMubW9kZWxUb1ZpZXdYKHRvRHJhdy5wb2ludHNbcG9pbnRJZHhdLlgpO1xuICAgICAgICB2YXIgeSA9IHRoaXMubW9kZWxUb1ZpZXdZKHRvRHJhdy5wb2ludHNbcG9pbnRJZHhdLlkpO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguc3Ryb2tlU3R5bGUgPSBcIiNmZmZcIjtcbiAgICAgICAgZXhwb3J0cy5FbmdpbmUuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguYXJjKHgsIHksIDUsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgZXhwb3J0cy5FbmdpbmUuY3R4LnN0cm9rZSgpO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5kaXN0SW5mbyA9IGZ1bmN0aW9uIChkaXN0KSB7XG4gICAgICAgIHZhciBsaWdodFNlY29uZHMgPSBkaXN0IC8gMzAwMDAwO1xuICAgICAgICB2YXIgbGlnaHRNaW51dGVzID0gbGlnaHRTZWNvbmRzIC8gNjA7XG4gICAgICAgIGxpZ2h0U2Vjb25kcyA9IGxpZ2h0U2Vjb25kcyAlIDYwO1xuICAgICAgICByZXR1cm4gZGlzdC50b0ZpeGVkKDApICsgXCJrbSwgXCIgKyBsaWdodE1pbnV0ZXMudG9GaXhlZCgwKSArIFwibSBcIiArIGxpZ2h0U2Vjb25kcy50b0ZpeGVkKDApICsgXCJzXCI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gcmVzcG9uc2UgaXMgdW5zaWduZWQgOCBiaXQgaW50ZWdlclxuICAgICAgICAgICAgdmFyIGR2ID0gbmV3IERhdGFWaWV3KHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIG9mZiA9IDA7XG4gICAgICAgICAgICBvZmYgPSB0aGF0LmVhcnRoUGF0aC5sb2FkKGR2LCBvZmYpO1xuICAgICAgICAgICAgb2ZmID0gdGhhdC5tYXJzUGF0aC5sb2FkKGR2LCBvZmYpO1xuICAgICAgICAgICAgb2ZmID0gdGhhdC5zaGlwLmxvYWQoZHYsIG9mZik7XG4gICAgICAgICAgICB0aGF0LmRyYXdTZWxmKCk7XG4gICAgICAgIH07XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSAkKFwiI2NhbnZhc1wiKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgICAgdmFyIHkgPSBldnQuY2xpZW50WSAtIHJlY3QudG9wO1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgPT0gVUlNb2RlLkFkZGluZ1BvaW50KSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RQb2ludElkeCh4LCB5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJBY2NlbFBvaW50ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RBY2NlbFBvaW50KHgsIHkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd1NlbGYoKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUua2V5RG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2dC5rZXk7XG4gICAgICAgIGlmIChrZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmhvdmVyQWNjZWxQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5BZGRpbmdQb2ludDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5rZXlVcCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2dC5rZXk7XG4gICAgICAgIGlmIChrZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmhvdmVyQWNjZWxQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5Ob3JtYWw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBFbmdpbmVTaW5nbGV0b247XG59KCkpO1xuO1xuZXhwb3J0cy5FbmdpbmUgPSBuZXcgRW5naW5lU2luZ2xldG9uKCk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbmdpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgb3JiaXRfMSA9IHJlcXVpcmUoXCIuL29yYml0XCIpO1xudmFyIGVuZ2luZV8xID0gcmVxdWlyZShcIi4vZW5naW5lXCIpO1xudmFyIE9CT2JqZWN0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9CT2JqZWN0KHNncCwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplLCBvcmJpdGVlKSB7XG4gICAgICAgIHRoaXMuc2dwID0gc2dwO1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICAgICAgdGhpcy52ZWwgPSB2ZWw7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5vcmJpdGVlID0gb3JiaXRlZTtcbiAgICB9XG4gICAgT0JPYmplY3QucHJvdG90eXBlLmluaXRPcmJpdGVyID0gZnVuY3Rpb24gKG9yYml0ZWUsIGFwb2dlZURpc3QsIGFwb2dlZVZlbCwgYW9wKSB7XG4gICAgICAgIHRoaXMub3JiaXRlZSA9IG9yYml0ZWU7XG4gICAgICAgIHZhciBhbmdsZU9mQXBvZ2VlID0gYW9wIC0gMy4xNDE1OTtcbiAgICAgICAgdGhpcy5wb3Muc2V0UlRoZXRhKGFwb2dlZURpc3QsIGFuZ2xlT2ZBcG9nZWUpO1xuICAgICAgICB0aGlzLnBvcy5hZGRWZWN0b3Iob3JiaXRlZS5wb3MpO1xuICAgICAgICB0aGlzLnZlbC5zZXQodGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnZlbC5yb3RhdGUoLTMuMTQxNTkgLyAyLjApO1xuICAgICAgICB0aGlzLnZlbC5zZXRMZW5ndGgoYXBvZ2VlVmVsKTtcbiAgICAgICAgdGhpcy5vcmJpdCA9IG5ldyBvcmJpdF8xLk9yYml0KDAsIDAsIDAsIDApO1xuICAgICAgICB0aGlzLm9yYml0LmluaXRQVihvcmJpdGVlLnNncCwgdGhpcy5wb3MsIHRoaXMudmVsKTtcbiAgICAgICAgdGhpcy5vcmJpdC5jb2xvciA9IHRoaXMuY29sb3I7XG4gICAgfTtcbiAgICBPQk9iamVjdC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgICAgIGlmICghdGhpcy5vcmJpdGVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFjYyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3I7XG4gICAgICAgIGFjYy5zZXQodGhpcy5vcmJpdGVlLnBvcyk7XG4gICAgICAgIGFjYy5zdWJ0cmFjdFZlY3Rvcih0aGlzLnBvcyk7XG4gICAgICAgIHZhciBhY2NMZW4gPSAoc2Vjb25kcyAqIHRoaXMub3JiaXRlZS5zZ3ApIC8gYWNjLmdldExlbmd0aFNxKCk7XG4gICAgICAgIGFjYy5zZXRMZW5ndGgoYWNjTGVuKTtcbiAgICAgICAgdGhpcy52ZWwuYWRkVmVjdG9yKGFjYyk7XG4gICAgICAgIHZhciB0b0FkZCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3I7XG4gICAgICAgIHRvQWRkLnNldCh0aGlzLnZlbCk7XG4gICAgICAgIHRvQWRkLnNjYWxhck11bHRpcGx5KHNlY29uZHMpO1xuICAgICAgICB0aGlzLnBvcy5hZGRWZWN0b3IodG9BZGQpO1xuICAgIH07XG4gICAgT0JPYmplY3QucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcmJpdCkge1xuICAgICAgICAgICAgdGhpcy5vcmJpdC5kcmF3U2VsZigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvcy5YKTtcbiAgICAgICAgdmFyIHkgPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9zLlkpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYXJjKHgsIHksIHRoaXMuc2l6ZSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGwoKTtcbiAgICB9O1xuICAgIE9CT2JqZWN0LnByb3RvdHlwZS5yZWNhbGNPcmJpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vcmJpdC5pbml0UFYodGhpcy5vcmJpdC51LCB0aGlzLnBvcywgdGhpcy52ZWwpO1xuICAgIH07XG4gICAgcmV0dXJuIE9CT2JqZWN0O1xufSgpKTtcbmV4cG9ydHMuT0JPYmplY3QgPSBPQk9iamVjdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9iamVjdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBlbmdpbmVfMSA9IHJlcXVpcmUoXCIuL2VuZ2luZVwiKTtcbnZhciBPcmJpdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPcmJpdChzZ3AsIGUsIGEsIHcpIHtcbiAgICAgICAgdGhpcy5pbml0KHNncCwgZSwgYSwgdyk7XG4gICAgfVxuICAgIE9yYml0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHNncCwgZSwgYSwgdykge1xuICAgICAgICB0aGlzLnUgPSBzZ3A7XG4gICAgICAgIHRoaXMuZSA9IGU7XG4gICAgICAgIHRoaXMuYSA9IGE7XG4gICAgICAgIHRoaXMudyA9IHc7XG4gICAgICAgIHRoaXMudmFsaWQgPSBlIDwgMS4wICYmIGEgPiAwLjA7XG4gICAgICAgIHRoaXMuZjEgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuZiA9IHRoaXMuZSAqIHRoaXMuYTtcbiAgICAgICAgdGhpcy5iID0gTWF0aC5zcXJ0KHRoaXMuYSAqIHRoaXMuYSAtIHRoaXMuZiAqIHRoaXMuZik7XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLmNlbnRlci5zZXRSVGhldGEodGhpcy5mLCB0aGlzLncpO1xuICAgICAgICB0aGlzLmYyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLmYyLnNldFJUaGV0YSgyICogdGhpcy5mLCB0aGlzLncpO1xuICAgICAgICB0aGlzLmVuZXJneSA9IC10aGlzLnUgLyAoMi4wICogdGhpcy5hKTtcbiAgICAgICAgdGhpcy5hcG9nZWUgPSB0aGlzLmEgKyB0aGlzLmY7XG4gICAgICAgIHRoaXMucGVyaWdlZSA9IHRoaXMuYSAtIHRoaXMuZjtcbiAgICAgICAgdGhpcy5vcmJpdEFyZWEgPSBNYXRoLlBJICogdGhpcy5hICogdGhpcy5iO1xuICAgICAgICB0aGlzLmNhbGNEcmF3UG9pbnRzKCk7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuaW5pdFBWID0gZnVuY3Rpb24gKHNncCwgb3JiaXRlclBvcywgb3JiaXRlclZlbCkge1xuICAgICAgICB0aGlzLmYxID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLnUgPSBzZ3A7XG4gICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xuICAgICAgICB2YXIgcmVsYXRpdmVQb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHJlbGF0aXZlUG9zLnNldChvcmJpdGVyUG9zKTtcbiAgICAgICAgcmVsYXRpdmVQb3Muc2NhbGFyTXVsdGlwbHkoLTEpO1xuICAgICAgICB2YXIgciA9IHJlbGF0aXZlUG9zLmdldExlbmd0aCgpO1xuICAgICAgICBpZiAociA8PSAwLjApIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9IG9yYml0ZXJWZWwuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIHRoaXMuZW5lcmd5ID0gKHYgKiB2IC8gMi4wKSAtICh0aGlzLnUgLyByKTtcbiAgICAgICAgaWYgKHRoaXMuZW5lcmd5ID49IDAuMCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYSA9IC10aGlzLnUgLyAoMi4wICogdGhpcy5lbmVyZ3kpO1xuICAgICAgICB2YXIgZCA9IDIuMCAqIHRoaXMuYSAtIHI7XG4gICAgICAgIHZhciBvcmJpdGVyQW5nbGUgPSByZWxhdGl2ZVBvcy5nZXRBbmdsZSgpO1xuICAgICAgICB2YXIgdmVsQW5nbGUgPSBvcmJpdGVyVmVsLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciB0aGV0YSA9IHZlY3Rvcl8xLmFuZ2xlRGlmZih2ZWxBbmdsZSwgb3JiaXRlckFuZ2xlKTtcbiAgICAgICAgdmFyIHBoaSA9IE1hdGguUEkgLSB0aGV0YTtcbiAgICAgICAgdGhpcy5mMi5zZXQob3JiaXRlclZlbCk7XG4gICAgICAgIHRoaXMuZjIuc2V0TGVuZ3RoKGQpO1xuICAgICAgICB0aGlzLmYyLnJvdGF0ZShwaGkpO1xuICAgICAgICB0aGlzLmYyLmFkZFZlY3RvcihvcmJpdGVyUG9zKTtcbiAgICAgICAgdGhpcy53ID0gdGhpcy5mMi5nZXRBbmdsZSgpO1xuICAgICAgICB0aGlzLmYgPSB0aGlzLmYyLmdldExlbmd0aCgpIC8gMjtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5mIC8gdGhpcy5hO1xuICAgICAgICB0aGlzLmluaXQoc2dwLCB0aGlzLmUsIHRoaXMuYSwgdGhpcy53KTtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5jYWxjRHJhd1BvaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhTdGVwID0gMi4wICogZW5naW5lXzEuRW5naW5lLmttUGVyUGl4ZWw7XG4gICAgICAgIHZhciBudW1Qb2ludHMgPSBNYXRoLnJvdW5kKCgyLjAgKiB0aGlzLmEpIC8geFN0ZXApICsgMjsgLy8gdGhlICsyIGlzIGZvciByb3VuZGluZyBzYWZldHlcbiAgICAgICAgdmFyIG1heERyYXdQb2ludHMgPSBudW1Qb2ludHMgKiAyO1xuICAgICAgICB0aGlzLmRyYXdQb2ludHMgPSBbXTtcbiAgICAgICAgdmFyIGZpcnN0SGFsZiA9IFtdO1xuICAgICAgICB2YXIgc2Vjb25kSGFsZiA9IFtdO1xuICAgICAgICB2YXIgaGFsZlBvcyA9IDA7XG4gICAgICAgIHZhciB4ID0gLXRoaXMuYTtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBhbHBoYSA9IDEuMCAtICh4ICogeCkgLyAodGhpcy5hICogdGhpcy5hKTtcbiAgICAgICAgICAgIHZhciB5ID0gTWF0aC5zcXJ0KHRoaXMuYiAqIHRoaXMuYiAqIGFscGhhKTtcbiAgICAgICAgICAgIGlmIChoYWxmUG9zID49IG51bVBvaW50cykge1xuICAgICAgICAgICAgICAgIHRocm93IFwiT29wc1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdvcmsgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKHgsIHkpO1xuICAgICAgICAgICAgd29yay5yb3RhdGUodGhpcy53KTtcbiAgICAgICAgICAgIHdvcmsuYWRkVmVjdG9yKHRoaXMuY2VudGVyKTtcbiAgICAgICAgICAgIGZpcnN0SGFsZltoYWxmUG9zXSA9IHtcbiAgICAgICAgICAgICAgICBYOiBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHdvcmsuWCksXG4gICAgICAgICAgICAgICAgWTogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh3b3JrLlkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd29yayA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoeCwgLXkpO1xuICAgICAgICAgICAgd29yay5yb3RhdGUodGhpcy53KTtcbiAgICAgICAgICAgIHdvcmsuYWRkVmVjdG9yKHRoaXMuY2VudGVyKTtcbiAgICAgICAgICAgIHNlY29uZEhhbGZbaGFsZlBvc10gPSB7XG4gICAgICAgICAgICAgICAgWDogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh3b3JrLlgpLFxuICAgICAgICAgICAgICAgIFk6IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kod29yay5ZKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbGZQb3MrKztcbiAgICAgICAgICAgIGlmICh4ID09IHRoaXMuYSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeCArPSB4U3RlcDtcbiAgICAgICAgICAgIGlmICh4ID4gdGhpcy5hKSB7XG4gICAgICAgICAgICAgICAgeCA9IHRoaXMuYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRyYXdQb2ludHMgPSBmaXJzdEhhbGY7XG4gICAgICAgIHRoaXMuZHJhd1BvaW50cy5wdXNoLmFwcGx5KHNlY29uZEhhbGYucmV2ZXJzZSgpKTtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkIHx8ICF0aGlzLmRyYXdQb2ludHMgfHwgdGhpcy5kcmF3UG9pbnRzLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBfYSA9IHRoaXMuZHJhd1BvaW50c1swXSwgbGFzdFggPSBfYS5YLCBsYXN0WSA9IF9hLlk7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2IgPSB0aGlzLmRyYXdQb2ludHM7IF9pIDwgX2IubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF9iW19pXTtcbiAgICAgICAgICAgIHZhciB0aGlzWCA9IHAuWCwgdGhpc1kgPSBwLlk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxpbmUgKFwiICsgbGFzdFggKyBcIiwgXCIgKyBsYXN0WSArIFwiKS0oXCIgKyB0aGlzWCArIFwiLCBcIiArIHRoaXNZICsgXCIpXCIpO1xuICAgICAgICAgICAgX2MgPSBbdGhpc1gsIHRoaXNZXSwgbGFzdFggPSBfY1swXSwgbGFzdFkgPSBfY1sxXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2M7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuZ2V0UiA9IGZ1bmN0aW9uICh0aGV0YSkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBudW1lcmF0b3IgPSB0aGlzLmEgKiAoMS4wIC0gdGhpcy5lICogdGhpcy5lKTtcbiAgICAgICAgdmFyIGRlbm9taW5hdG9yID0gMS4wIC0gdGhpcy5lICogKE1hdGguY29zKHRoZXRhIC0gdGhpcy53KSk7XG4gICAgICAgIHJldHVybiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5nZXRQb3MgPSBmdW5jdGlvbiAodGhldGEpIHtcbiAgICAgICAgdmFyIHBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdmFyIHIgPSB0aGlzLmdldFIodGhldGEpO1xuICAgICAgICBwb3Muc2V0UlRoZXRhKHIsIHRoZXRhKTtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5nZXRWZWwgPSBmdW5jdGlvbiAodGhldGEpIHtcbiAgICAgICAgdmFyIHBvcyA9IHRoaXMuZ2V0UG9zKHRoZXRhKTtcbiAgICAgICAgdmFyIHIgPSBwb3MuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIHZhciB2U3F1YXJlZCA9IDIuMCAqICh0aGlzLmVuZXJneSArIHRoaXMudSAvIHIpO1xuICAgICAgICB2YXIgdiA9IE1hdGguc3FydCh2U3F1YXJlZCk7XG4gICAgICAgIHZhciBhbmdsZVRvRjEgPSBNYXRoLlBJICsgdGhldGE7XG4gICAgICAgIHZhciBsb29rQXRGMiA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgbG9va0F0RjIuc2V0KHRoaXMuZjIpO1xuICAgICAgICBsb29rQXRGMi5zdWJ0cmFjdFZlY3Rvcihwb3MpO1xuICAgICAgICB2YXIgYW5nbGVUb0YyID0gbG9va0F0RjIuZ2V0QW5nbGUoKTtcbiAgICAgICAgdmFyIGRpZmYgPSB2ZWN0b3JfMS5hbmdsZURpZmYoYW5nbGVUb0YxLCBhbmdsZVRvRjIpO1xuICAgICAgICB2YXIgYW5nbGUgPSBhbmdsZVRvRjEgKyBkaWZmIC8gMi4wO1xuICAgICAgICB2YXIgdmVsQW5nbGUgPSBhbmdsZSArIChNYXRoLlBJIC8gMi4wKTtcbiAgICAgICAgdmFyIG91dCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgb3V0LnNldFJUaGV0YSh2LCB2ZWxBbmdsZSk7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gT3JiaXQ7XG59KCkpO1xuZXhwb3J0cy5PcmJpdCA9IE9yYml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JiaXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgZW5naW5lXzEgPSByZXF1aXJlKFwiLi9lbmdpbmVcIik7XG52YXIgQWNjVHlwZTtcbihmdW5jdGlvbiAoQWNjVHlwZSkge1xuICAgIEFjY1R5cGVbQWNjVHlwZVtcIk5vcm1hbFwiXSA9IDBdID0gXCJOb3JtYWxcIjtcbiAgICBBY2NUeXBlW0FjY1R5cGVbXCJSZWRpcmVjdFwiXSA9IDFdID0gXCJSZWRpcmVjdFwiO1xuICAgIEFjY1R5cGVbQWNjVHlwZVtcIlN0b3BUcmFjZVwiXSA9IDJdID0gXCJTdG9wVHJhY2VcIjtcbn0pKEFjY1R5cGUgfHwgKEFjY1R5cGUgPSB7fSkpO1xuO1xuO1xudmFyIFBBVEhfQUNDRUxFUkFUSU9OID0gMC4wMDAwMDI7XG52YXIgUE9JTlRTX1RJTUUgPSA4NjQwMC4wO1xudmFyIEZBVEFMX1NVTl9BUFBST0FDSCA9IDM1MDAwMDAwLjA7XG52YXIgRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCA9IDUwO1xudmFyIFBhdGggPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGF0aCgpIHtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMgPSBbXTtcbiAgICAgICAgdGhpcy5wb2ludHMgPSBbXTtcbiAgICB9XG4gICAgUGF0aC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChvcmJpdGVlLCBwb3MsIHZlbCwgY29sb3IsIHNpemUpIHtcbiAgICAgICAgdGhpcy5pbml0Tm9BY2Mob3JiaXRlZSwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplKTtcbiAgICAgICAgdmFyIG5ld1BvaW50ID0gdGhpcy5jcmVhdGVBY2NlbGVyYXRpb25Qb2ludCgwKTtcbiAgICAgICAgbmV3UG9pbnQuYW5nbGUgPSBNYXRoLlBJIC8gMi4wO1xuICAgICAgICBuZXdQb2ludC5tYWcgPSBQQVRIX0FDQ0VMRVJBVElPTjtcbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5pbml0Tm9BY2MgPSBmdW5jdGlvbiAob3JiaXRlZSwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5vcmJpdGVlID0gb3JiaXRlZTtcbiAgICAgICAgdGhpcy5zdGFydFBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5zdGFydFBvcy5zZXQocG9zKTtcbiAgICAgICAgdGhpcy5zdGFydFZlbCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5zdGFydFZlbC5zZXQodmVsKTtcbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5pbml0Tm9BY2NPcmJpdGVyQW5nbGUgPSBmdW5jdGlvbiAob3JiaXRlciwgYW5nbGUpIHtcbiAgICAgICAgYW5nbGUgPSAtTWF0aC5QSSAvIDIuMCAtIGFuZ2xlO1xuICAgICAgICB2YXIgb3JiaXRlZSA9IG9yYml0ZXIub3JiaXRlZTtcbiAgICAgICAgdmFyIHBvcyA9IG9yYml0ZXIub3JiaXQuZ2V0UG9zKGFuZ2xlKTtcbiAgICAgICAgdmFyIHZlbCA9IG9yYml0ZXIub3JiaXQuZ2V0VmVsKGFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdE5vQWNjKG9yYml0ZWUsIHBvcywgdmVsLCBvcmJpdGVyLm9yYml0LmNvbG9yLCBvcmJpdGVyLnNpemUpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUucmVtb3ZlQWNjZWxlcmF0aW9uUG9pbnQgPSBmdW5jdGlvbiAoYXApIHtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5maWx0ZXIoZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICE9PSBhcDsgfSk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5hZGp1c3RBY2NlbGVyYXRpb25Qb2ludCA9IGZ1bmN0aW9uIChhcCwgbXgsIG15LCBuZXdNYWcpIHtcbiAgICAgICAgdmFyIHBvaW50SWR4ID0gYXAucG9pbnRJZHg7XG4gICAgICAgIHZhciBhcFggPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW3BvaW50SWR4XS5YKTtcbiAgICAgICAgdmFyIGFwWSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbcG9pbnRJZHhdLlkpO1xuICAgICAgICB2YXIgbmV3TGluZSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IobXggLSBhcFgsIG15IC0gYXBZKTtcbiAgICAgICAgdmFyIHVuYWRqdXN0ZWRBbmcgPSBuZXdMaW5lLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciBncmF2ID0gdGhpcy5nZXRHcmF2Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICB2YXIgZ3JhdkFuZyA9IGdyYXYuZ2V0QW5nbGUoKTtcbiAgICAgICAgYXAuYW5nbGUgPSB2ZWN0b3JfMS5hbmdsZURpZmYoZ3JhdkFuZywgdW5hZGp1c3RlZEFuZyk7XG4gICAgICAgIGFwLm1hZyA9IG5ld01hZztcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldEdyYXZGb3JQb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICByZXN1bHQuc2V0KHRoaXMub3JiaXRlZS5wb3MpO1xuICAgICAgICBpZiAocG9pbnRJZHggPT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnN1YnRyYWN0VmVjdG9yKHRoaXMuc3RhcnRQb3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0LnN1YnRyYWN0VmVjdG9yKHRoaXMucG9pbnRzW3BvaW50SWR4IC0gMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5jcmVhdGVBY2NlbGVyYXRpb25Qb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICB2YXIgYXAgPSB7IHBvaW50SWR4OiBwb2ludElkeCB9O1xuICAgICAgICBpZiAodGhpcy5hY2NlbGVyYXRpb25Qb2ludHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHRocnVzdCA9IHRoaXMuZ2V0VGhydXN0Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICAgICAgYXAubWFnID0gdGhydXN0LmdldExlbmd0aCgpO1xuICAgICAgICAgICAgdmFyIGdyYXYgPSB0aGlzLmdldEdyYXZGb3JQb2ludChwb2ludElkeCk7XG4gICAgICAgICAgICBhcC5hbmdsZSA9IHZlY3Rvcl8xLmFuZ2xlRGlmZihncmF2LmdldEFuZ2xlKCksIHRocnVzdC5nZXRBbmdsZSgpKTtcbiAgICAgICAgfVxuICAgICAgICBhcC50eXBlID0gQWNjVHlwZS5Ob3JtYWw7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLnB1c2goYXApO1xuICAgICAgICByZXR1cm4gYXA7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5nZXRUaHJ1c3RGb3JQb2ludCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICBpZiAodGhpcy5hY2NlbGVyYXRpb25Qb2ludHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZ3JhdiA9IHRoaXMuZ2V0R3JhdkZvclBvaW50KHBvaW50SWR4KTtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGhpc0FwID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKHRoaXNBcC5wb2ludElkeCA+IHBvaW50SWR4KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcCA9IHRoaXNBcDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFwKSB7XG4gICAgICAgICAgICBhcCA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzW3RoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhY2MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIGFjYy5zZXQoZ3Jhdik7XG4gICAgICAgIGFjYy5yb3RhdGUoYXAuYW5nbGUpO1xuICAgICAgICBhY2Muc2V0TGVuZ3RoKGFwLm1hZyk7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5jYWxjUG9pbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICBwb3Muc2V0KHRoaXMuc3RhcnRQb3MpO1xuICAgICAgICB2YXIgdmVsID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2ZWwuc2V0KHRoaXMuc3RhcnRWZWwpO1xuICAgICAgICB2YXIgc3RvcElkeCA9IHRoaXMuZ2V0U3RvcFBvaW50KCk7XG4gICAgICAgIGlmICghdGhpcy5wb2ludHNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMucG9pbnRzWzBdID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9pbnRzWzBdLnNldChwb3MpO1xuICAgICAgICB2YXIgaGFsdCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdG9wSWR4OyBpKyspIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5wb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpXSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoYWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludHNbaV0uc2V0KHRoaXMucG9pbnRzW2kgLSAxXSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZ3JhdiA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIGdyYXYuc2V0KHRoaXMub3JiaXRlZS5wb3MpO1xuICAgICAgICAgICAgZ3Jhdi5zdWJ0cmFjdFZlY3Rvcihwb3MpO1xuICAgICAgICAgICAgdmFyIGdyYXZBY2NMZW4gPSAoUE9JTlRTX1RJTUUgKiB0aGlzLm9yYml0ZWUuc2dwKSAvIGdyYXYuZ2V0TGVuZ3RoU3EoKTtcbiAgICAgICAgICAgIGdyYXYuc2V0TGVuZ3RoKGdyYXZBY2NMZW4pO1xuICAgICAgICAgICAgdmVsLmFkZFZlY3RvcihncmF2KTtcbiAgICAgICAgICAgIHZhciB0aHJ1c3RBY2MgPSB0aGlzLmdldFRocnVzdEZvclBvaW50KGkpO1xuICAgICAgICAgICAgdGhydXN0QWNjLnNjYWxhck11bHRpcGx5KFBPSU5UU19USU1FKTtcbiAgICAgICAgICAgIHZlbC5hZGRWZWN0b3IodGhydXN0QWNjKTtcbiAgICAgICAgICAgIHZhciBhcDtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICBpZiAoYXAucG9pbnRJZHggIT0gaSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKGFwLnR5cGUgPT0gQWNjVHlwZS5SZWRpcmVjdCkge1xuICAgICAgICAgICAgICAgICAgICB2ZWwuc2V0UlRoZXRhKHZlbC5nZXRMZW5ndGgoKSwgdGhydXN0QWNjLmdldEFuZ2xlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JrID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICAgICAgd29yay5zZXQodmVsKTtcbiAgICAgICAgICAgIHdvcmsuc2NhbGFyTXVsdGlwbHkoUE9JTlRTX1RJTUUpO1xuICAgICAgICAgICAgcG9zLmFkZFZlY3Rvcih3b3JrKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5wb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpXSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucG9pbnRzW2ldLnNldChwb3MpO1xuICAgICAgICAgICAgaWYgKHZlY3Rvcl8xLmdldERpc3RhbmNlKHRoaXMucG9pbnRzW2ldLCB0aGlzLm9yYml0ZWUucG9zKSA8IEZBVEFMX1NVTl9BUFBST0FDSCkge1xuICAgICAgICAgICAgICAgIGhhbHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uIChzZWwpIHtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgbGFzdFg7XG4gICAgICAgIHZhciBsYXN0WTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiB0aGlzLnBvaW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1tpXS5YKTtcbiAgICAgICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1tpXS5ZKTtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0U3RvcFBvaW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGlnaGVzdElkeCA9IDA7XG4gICAgICAgIHZhciBhcDtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXAgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAoYXAudHlwZSA9PSBBY2NUeXBlLlN0b3BUcmFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcC5wb2ludElkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gOTAwIC0gMTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldE5lYXJlc3RQb2ludElkeCA9IGZ1bmN0aW9uICh2aWV3WCwgdmlld1kpIHtcbiAgICAgICAgdmFyIE1BWF9ESVNUID0gRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCArIERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggLyAxMDtcbiAgICAgICAgdmFyIE1BWF9ESVNUX1NRID0gTUFYX0RJU1QgKiBNQVhfRElTVDtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgY2xvc2VzdElkeCA9IC0xO1xuICAgICAgICB2YXIgY2xvc2VzdERpc3RTcSA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2ldLlgpO1xuICAgICAgICAgICAgdmFyIGR5ID0gdmlld1kgLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW2ldLlkpO1xuICAgICAgICAgICAgdmFyIGRpc3RTcSA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgICAgICAgaWYgKGRpc3RTcSA8IE1BWF9ESVNUX1NRKSB7XG4gICAgICAgICAgICAgICAgaWYgKChjbG9zZXN0SWR4ID09IC0xKSB8fCAoZGlzdFNxIDwgY2xvc2VzdERpc3RTcSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3RTcSA9IGRpc3RTcTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdElkeCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXN0SWR4O1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0TmVhcmVzdEFjY2VsUG9pbnQgPSBmdW5jdGlvbiAodmlld1gsIHZpZXdZKSB7XG4gICAgICAgIHZhciBNQVhfRElTVCA9IERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggKyBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIIC8gMTA7XG4gICAgICAgIHZhciBNQVhfRElTVF9TUSA9IE1BWF9ESVNUICogTUFYX0RJU1Q7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgdmFyIGNsb3Nlc3RBcDtcbiAgICAgICAgdmFyIGNsb3Nlc3REaXN0U3EgPSAwO1xuICAgICAgICB2YXIgYXA7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFwID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2FwLnBvaW50SWR4XS5YKTtcbiAgICAgICAgICAgIHZhciBkeSA9IHZpZXdZIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1thcC5wb2ludElkeF0uWSk7XG4gICAgICAgICAgICB2YXIgZGlzdFNxID0gZHggKiBkeCArIGR5ICogZHk7XG4gICAgICAgICAgICBpZiAoZGlzdFNxIDwgTUFYX0RJU1RfU1EpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCFjbG9zZXN0QXApIHx8IChkaXN0U3EgPCBjbG9zZXN0RGlzdFNxKSkge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0RGlzdFNxID0gZGlzdFNxO1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0QXAgPSBhcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3Nlc3RBcDtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAoZHYsIG9mZikge1xuICAgICAgICB0aGlzLnN0YXJ0UG9zLlggPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0UG9zLlkgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0VmVsLlggPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0VmVsLlkgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvblBvaW50cyA9IFtdO1xuICAgICAgICB2YXIgbnVtUG9pbnRzID0gZHYuZ2V0SW50MzIob2ZmKTtcbiAgICAgICAgb2ZmICs9IDQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUG9pbnRzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhcCA9IHt9O1xuICAgICAgICAgICAgYXAucG9pbnRJZHggPSBkdi5nZXRJbnQzMihvZmYpO1xuICAgICAgICAgICAgb2ZmICs9IDQ7XG4gICAgICAgICAgICBhcC50eXBlID0gZHYuZ2V0SW50MzIob2ZmKTtcbiAgICAgICAgICAgIG9mZiArPSA0O1xuICAgICAgICAgICAgYXAuYW5nbGUgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgICAgIGFwLm1hZyA9IGR2LmdldEZsb2F0NjQob2ZmLCB0cnVlKTtcbiAgICAgICAgICAgIG9mZiArPSA4O1xuICAgICAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMucHVzaChhcCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgICAgIHJldHVybiBvZmY7XG4gICAgfTtcbiAgICByZXR1cm4gUGF0aDtcbn0oKSk7XG5leHBvcnRzLlBhdGggPSBQYXRoO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGF0aC5qcy5tYXAiLCJFbmdpbmUgPSByZXF1aXJlKFwiLi9lbmdpbmVcIikuRW5naW5lO1xuJChmdW5jdGlvbigpIHtcbiAgRW5naW5lLmluaXQoJChcIiNjYW52YXNcIikpO1xuICBjb25zb2xlLmxvZyhFbmdpbmUpO1xuICBFbmdpbmUuZHJhd1NlbGYoKTtcbiAgJChcIiNvcmlnaW5hbFwiKS5jbGljayhmdW5jdGlvbigpIHsgRW5naW5lLmxvYWQoXCJvcmlnaW5hbC5zYXZcIik7IH0pXG4gICQoXCIjc29sNmFib3J0XCIpLmNsaWNrKGZ1bmN0aW9uKCkgeyBFbmdpbmUubG9hZChcInNvbDZhYm9ydC5zYXZcIik7IH0pXG4gICQoXCIjZmluYWxcIikuY2xpY2soZnVuY3Rpb24oKSB7IEVuZ2luZS5sb2FkKFwiZmluYWwuc2F2XCIpOyB9KVxufSk7XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFZlY3RvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWZWN0b3IoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IDA7IH1cbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgICAgdGhpcy5YID0geDtcbiAgICAgICAgdGhpcy5ZID0geTtcbiAgICB9XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodikgeyB0aGlzLlggPSB2Llg7IHRoaXMuWSA9IHYuWTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCArPSB2Llg7IHRoaXMuWSArPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCAtPSB2Llg7IHRoaXMuWSAtPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJNdWx0aXBseSA9IGZ1bmN0aW9uIChuKSB7IHRoaXMuWCAqPSBuOyB0aGlzLlkgKj0gbjsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmdldExlbmd0aFNxID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5YICogdGhpcy5YICsgdGhpcy5ZICogdGhpcy5ZOyB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRMZW5ndGggPSBmdW5jdGlvbiAobikge1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7XG4gICAgICAgIHRoaXMuc2NhbGFyTXVsdGlwbHkobiAvIGxlbik7XG4gICAgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmcpIHtcbiAgICAgICAgX2EgPSBbdGhpcy5YICogTWF0aC5jb3MoYW5nKSAtIHRoaXMuWSAqIE1hdGguc2luKGFuZyksXG4gICAgICAgICAgICB0aGlzLlggKiBNYXRoLnNpbihhbmcpICsgdGhpcy5ZICogTWF0aC5jb3MoYW5nKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRSVGhldGEgPSBmdW5jdGlvbiAociwgdGhldGEpIHtcbiAgICAgICAgX2EgPSBbciAqIE1hdGguY29zKHRoZXRhKSwgciAqIE1hdGguc2luKHRoZXRhKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5nZXRBbmdsZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1hdGguYXRhbjIodGhpcy5ZLCB0aGlzLlgpOyB9O1xuICAgIHJldHVybiBWZWN0b3I7XG59KCkpO1xuZXhwb3J0cy5WZWN0b3IgPSBWZWN0b3I7XG5mdW5jdGlvbiBnZXREaXN0YW5jZShhLCBiKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCgoYS5YIC0gYi5YKSAqIChhLlggLSBiLlgpICsgKGEuWSAtIGIuWSkgKiAoYS5ZIC0gYi5ZKSk7XG59XG5leHBvcnRzLmdldERpc3RhbmNlID0gZ2V0RGlzdGFuY2U7XG5mdW5jdGlvbiBhbmdsZURpZmYoYjFSYWQsIGIyUmFkKSB7XG4gICAgdmFyIGIxeSA9IE1hdGguY29zKGIxUmFkKTtcbiAgICB2YXIgYjF4ID0gTWF0aC5zaW4oYjFSYWQpO1xuICAgIHZhciBiMnkgPSBNYXRoLmNvcyhiMlJhZCk7XG4gICAgdmFyIGIyeCA9IE1hdGguc2luKGIyUmFkKTtcbiAgICB2YXIgY3Jvc3NwID0gYjF5ICogYjJ4IC0gYjJ5ICogYjF4O1xuICAgIHZhciBkb3RwID0gYjF4ICogYjJ4ICsgYjF5ICogYjJ5O1xuICAgIGlmIChjcm9zc3AgPiAwLilcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhkb3RwKTtcbiAgICByZXR1cm4gLU1hdGguYWNvcyhkb3RwKTtcbn1cbmV4cG9ydHMuYW5nbGVEaWZmID0gYW5nbGVEaWZmO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjdG9yLmpzLm1hcCJdfQ==
