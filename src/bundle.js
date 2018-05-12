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
            $(el).on("touchmove", function (e) { return _this.mouseMove(e); });
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
        this.ctx.canvas.width = this.screenW;
        this.ctx.canvas.height = this.screenH;
        this.ctx.clearRect(0, 0, this.screenW, this.screenH);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.screenW, this.screenH);
        this.sun.drawSelf();
        this.earthPath.drawSelf();
        this.marsPath.drawSelf();
        this.ship.drawProgressivePath(this.playbackStepIdx);
        this.ctx.fillStyle = this.earth.color;
        this.drawPathObject(this.earthPath, this.playbackStepIdx);
        this.ctx.fillStyle = this.mars.color;
        this.drawPathObject(this.marsPath, this.playbackStepIdx);
        this.ctx.fillStyle = this.ship.color;
        this.drawPathObject(this.ship, this.playbackStepIdx);
        var missionDay = this.playbackStepIdx + 1;
        var label = "Mission day: " + missionDay + " ";
        if (missionDay >= 133) {
            // work out the sol
            var sol = missionDay - 132;
            sol *= 86400.0;
            sol /= 88775.24409;
            label = label + ("Sol: " + sol.toFixed(0));
        }
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "12px Arial";
        this.ctx.fillText(label, 10, 20);
    };
    EngineSingleton.prototype.drawNormal = function () {
        this.ctx.canvas.width = this.screenW;
        this.ctx.canvas.height = this.screenH;
        this.ctx.clearRect(0, 0, this.screenW, this.screenH);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.screenW, this.screenH);
        this.sun.drawSelf();
        this.earthPath.drawSelf();
        this.marsPath.drawSelf();
        this.ship.drawSelf(this.hoverAccelPoint);
        if (this.hoverPathPointIdx != -1) {
            this.ctx.strokeStyle = "#ff0000";
            this.ship.drawThrustLine(this.hoverPathPointIdx);
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
        exports.Engine.ctx.beginPath();
        exports.Engine.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        exports.Engine.ctx.fill();
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
        var x = (evt.clientX || evt.touches[0].clientX) - rect.left;
        var y = (evt.clientY || evt.touches[0].clientY) - rect.top;
        // if (this.uiMode == UIMode.AddingPoint) {
        this.hoverPathPointIdx = this.ship.getNearestPointIdx(x, y);
        // } else {
        this.hoverAccelPoint = this.ship.getNearestAccelPoint(x, y);
        // }
        this.drawSelf();
        evt.preventDefault();
    };
    EngineSingleton.prototype.playbackTick = function () {
        var _this = this;
        if (this.uiMode != UIMode.Playback)
            return;
        var stopIdx = this.ship.getStopPoint();
        if (this.playbackStepIdx <= stopIdx) {
            this.drawSelf();
            this.playbackStepIdx++;
            setTimeout(function () { return _this.playbackTick(); }, 320 - $("#speed").val());
        }
        else {
            this.playPause();
        }
    };
    EngineSingleton.prototype.playPause = function () {
        if (this.uiMode != UIMode.Playback) {
            this.playbackStepIdx = 0;
            this.uiMode = UIMode.Playback;
            this.playbackTick();
            $("#pause").show();
            $("#play").hide();
        }
        else {
            this.uiMode = UIMode.Inert;
            $("#play").show();
            $("#pause").hide();
        }
    };
    EngineSingleton.prototype.keyDown = function (evt) {
        var key = evt.key;
        if (key == "Shift") {
            this.hoverPathPointIdx = -1;
            this.hoverAccelPoint = null;
            this.uiMode = UIMode.AddingPoint;
        }
        if (key == " ") {
            this.playPause();
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
    Path.prototype.drawProgressivePath = function (pointIdx) {
        var stopIdx = this.getStopPoint();
        if (stopIdx > pointIdx) {
            stopIdx = pointIdx;
        }
        console.log("Draw prog path until " + stopIdx);
        engine_1.Engine.ctx.beginPath();
        engine_1.Engine.ctx.strokeStyle = this.color;
        for (var i = 0; i <= stopIdx; i++) {
            var x = engine_1.Engine.modelToViewX(this.points[i].X);
            var y = engine_1.Engine.modelToViewY(this.points[i].Y);
            var draw = false;
            if (i != 0) {
                var thrust = this.getThrustForPoint(i);
                if (thrust.getLength() != 0.0) {
                    draw = true;
                }
                if (i > 170)
                    draw = true;
            }
            if (draw) {
                if (i == 0) {
                    engine_1.Engine.ctx.moveTo(x, y);
                }
                else {
                    engine_1.Engine.ctx.lineTo(x, y);
                }
            }
            console.log("Move to " + x + "," + y);
        }
        engine_1.Engine.ctx.stroke();
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
            var i = ap.pointIdx;
            var x = engine_1.Engine.modelToViewX(this.points[i].X);
            var y = engine_1.Engine.modelToViewY(this.points[i].Y);
            if (ap == sel) {
                engine_1.Engine.ctx.fillStyle = "#ffff00";
            }
            else if (ap.type == AccType.Redirect) {
                engine_1.Engine.ctx.fillStyle = "#0000ff";
            }
            else {
                engine_1.Engine.ctx.fillStyle = "#ff0000";
            }
            engine_1.Engine.ctx.beginPath();
            engine_1.Engine.ctx.arc(x, y, this.size, 0, 2 * Math.PI);
            engine_1.Engine.ctx.fill();
            this.drawThrustLine(i);
            if (ap.type == AccType.StopTrace)
                break;
        }
    };
    Path.prototype.drawThrustLine = function (pointIDX) {
        if (pointIDX == -1)
            return;
        var vec = this.getThrustForPoint(pointIDX);
        if (vec.getLength() == 0.0)
            return;
        vec.setLength(DISPLAY_THRUSTLINE_LENGTH);
        var x = engine_1.Engine.modelToViewX(this.points[pointIDX].X);
        var y = engine_1.Engine.modelToViewY(this.points[pointIDX].Y);
        engine_1.Engine.ctx.strokeStyle = "#fff";
        engine_1.Engine.ctx.beginPath();
        engine_1.Engine.ctx.moveTo(x, y);
        engine_1.Engine.ctx.lineTo(x + vec.X, y + vec.Y);
        engine_1.Engine.ctx.stroke();
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
  $("#pause").hide();
  $("#play,#pause").click(function() { Engine.playPause(); })

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZW5naW5lLmpzIiwic3JjL29iamVjdC5qcyIsInNyYy9vcmJpdC5qcyIsInNyYy9wYXRoLmpzIiwic3JjL3N0YXJ0LmpzIiwic3JjL3ZlY3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBvYmplY3RfMSA9IHJlcXVpcmUoXCIuL29iamVjdFwiKTtcbnZhciBwYXRoXzEgPSByZXF1aXJlKFwiLi9wYXRoXCIpO1xudmFyIE1BUlNfQVBPR0VFID0gMjQ5MjA5MzAwLjA7XG52YXIgU1VOX1NHUCA9IDEzMjcxMjQ0MDAxOC4wO1xudmFyIE1BUlNfQVBPR0VFX1ZFTCA9IDIxLjk3O1xudmFyIE1BUlNfQU9QID0gNC45OTk3O1xudmFyIEVBUlRIX0FQT0dFRSA9IDE1MjA5ODIzMi4wO1xudmFyIEVBUlRIX0FQT0dFRV9WRUwgPSAyOS4zO1xudmFyIEVBUlRIX0FPUCA9IDEuOTkzMzA7XG52YXIgcm9vdCA9IHRoaXM7XG52YXIgUE9JTlRTX1RJTUUgPSA4NjQwMC4wO1xudmFyIFVJTW9kZTtcbihmdW5jdGlvbiAoVUlNb2RlKSB7XG4gICAgVUlNb2RlW1VJTW9kZVtcIk5vcm1hbFwiXSA9IDBdID0gXCJOb3JtYWxcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiUGxheWJhY2tcIl0gPSAxXSA9IFwiUGxheWJhY2tcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiQWRkaW5nUG9pbnRcIl0gPSAyXSA9IFwiQWRkaW5nUG9pbnRcIjtcbiAgICBVSU1vZGVbVUlNb2RlW1wiSW5lcnRcIl0gPSAzXSA9IFwiSW5lcnRcIjtcbn0pKFVJTW9kZSB8fCAoVUlNb2RlID0ge30pKTtcbjtcbnZhciBFbmdpbmVTaW5nbGV0b24gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRW5naW5lU2luZ2xldG9uKCkge1xuICAgICAgICAvLyBVSSBzdHVmZlxuICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5Ob3JtYWw7XG4gICAgICAgIHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggPSAtMTtcbiAgICB9XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5XID0gZWwud2lkdGgoKTtcbiAgICAgICAgICAgIHRoaXMuc2NyZWVuSCA9IGVsLmhlaWdodCgpO1xuICAgICAgICAgICAgdGhpcy5jdHggPSBlbFswXS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICAkKGVsKS5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VNb3ZlKGUpOyB9KTtcbiAgICAgICAgICAgICQoZWwpLm9uKFwidG91Y2htb3ZlXCIsIGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5tb3VzZU1vdmUoZSk7IH0pO1xuICAgICAgICAgICAgJCh3aW5kb3cpLmtleWRvd24oZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLmtleURvd24oZSk7IH0pO1xuICAgICAgICAgICAgJCh3aW5kb3cpLmtleXVwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5rZXlVcChlKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNjcmVlblcgPSA2NDA7XG4gICAgICAgICAgICB0aGlzLnNjcmVlbkggPSA0ODA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jZW50ZXIgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciByID0gTUFSU19BUE9HRUUgKiAxLjA1O1xuICAgICAgICB2YXIgd2lkdGggPSByICogMi4wO1xuICAgICAgICB0aGlzLmttUGVyUGl4ZWwgPSAyICogd2lkdGggLyB0aGlzLnNjcmVlblc7XG4gICAgICAgIHZhciBzdW5Qb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciBzdW5WZWwgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuc3VuID0gbmV3IG9iamVjdF8xLk9CT2JqZWN0KFNVTl9TR1AsIHN1blBvcywgc3VuVmVsLCBcIiNmZmZmMDBcIiwgOCwgbnVsbCk7XG4gICAgICAgIHRoaXMubWFycyA9IG5ldyBvYmplY3RfMS5PQk9iamVjdCgwLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKSwgXCIjZmY3ZjdmXCIsIDEsIHRoaXMuc3VuKTtcbiAgICAgICAgdGhpcy5tYXJzLmluaXRPcmJpdGVyKHRoaXMuc3VuLCBNQVJTX0FQT0dFRSwgTUFSU19BUE9HRUVfVkVMLCBNQVJTX0FPUCk7XG4gICAgICAgIHRoaXMuZWFydGggPSBuZXcgb2JqZWN0XzEuT0JPYmplY3QoMCwgbmV3IHZlY3Rvcl8xLlZlY3RvcigpLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIFwiIzdmN2ZmZlwiLCAxLCB0aGlzLnN1bik7XG4gICAgICAgIHRoaXMuZWFydGguaW5pdE9yYml0ZXIodGhpcy5zdW4sIEVBUlRIX0FQT0dFRSwgRUFSVEhfQVBPR0VFX1ZFTCwgRUFSVEhfQU9QKTtcbiAgICAgICAgdGhpcy5tYXJzUGF0aCA9IG5ldyBwYXRoXzEuUGF0aCgpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLm1hcnMsIDUuNDQyOTU3NTUyMik7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoID0gbmV3IHBhdGhfMS5QYXRoKCk7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLmVhcnRoLCA0Ljk3NDU4NzU1MjIpO1xuICAgICAgICB0aGlzLnNoaXAgPSBuZXcgcGF0aF8xLlBhdGgoKTtcbiAgICAgICAgdGhpcy5zaGlwLmluaXQodGhpcy5zdW4sIHRoaXMuZWFydGhQYXRoLnN0YXJ0UG9zLCB0aGlzLmVhcnRoUGF0aC5zdGFydFZlbCwgXCIjN2Y3ZjdmXCIsIDUpO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5tb2RlbFRvVmlld1ggPSBmdW5jdGlvbiAobW9kZWxYKSB7XG4gICAgICAgIHZhciB4ID0gbW9kZWxYIC0gdGhpcy5jZW50ZXIuWDtcbiAgICAgICAgeCAvPSB0aGlzLmttUGVyUGl4ZWw7XG4gICAgICAgIHJldHVybiB4ICsgdGhpcy5zY3JlZW5XIC8gMjtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubW9kZWxUb1ZpZXdZID0gZnVuY3Rpb24gKG1vZGVsWSkge1xuICAgICAgICB2YXIgeSA9IG1vZGVsWSAtIHRoaXMuY2VudGVyLlk7XG4gICAgICAgIHkgLz0gdGhpcy5rbVBlclBpeGVsO1xuICAgICAgICByZXR1cm4geSArIHRoaXMuc2NyZWVuSCAvIDI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgPT0gVUlNb2RlLlBsYXliYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdQbGF5YmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kcmF3Tm9ybWFsKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd1BsYXliYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmN0eC5jYW52YXMud2lkdGggPSB0aGlzLnNjcmVlblc7XG4gICAgICAgIHRoaXMuY3R4LmNhbnZhcy5oZWlnaHQgPSB0aGlzLnNjcmVlbkg7XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjcmVlblcsIHRoaXMuc2NyZWVuSCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IFwiIzAwMFwiO1xuICAgICAgICB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLnNjcmVlblcsIHRoaXMuc2NyZWVuSCk7XG4gICAgICAgIHRoaXMuc3VuLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMubWFyc1BhdGguZHJhd1NlbGYoKTtcbiAgICAgICAgdGhpcy5zaGlwLmRyYXdQcm9ncmVzc2l2ZVBhdGgodGhpcy5wbGF5YmFja1N0ZXBJZHgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmVhcnRoLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMuZWFydGhQYXRoLCB0aGlzLnBsYXliYWNrU3RlcElkeCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMubWFycy5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLm1hcnNQYXRoLCB0aGlzLnBsYXliYWNrU3RlcElkeCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2hpcC5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLnNoaXAsIHRoaXMucGxheWJhY2tTdGVwSWR4KTtcbiAgICAgICAgdmFyIG1pc3Npb25EYXkgPSB0aGlzLnBsYXliYWNrU3RlcElkeCArIDE7XG4gICAgICAgIHZhciBsYWJlbCA9IFwiTWlzc2lvbiBkYXk6IFwiICsgbWlzc2lvbkRheSArIFwiIFwiO1xuICAgICAgICBpZiAobWlzc2lvbkRheSA+PSAxMzMpIHtcbiAgICAgICAgICAgIC8vIHdvcmsgb3V0IHRoZSBzb2xcbiAgICAgICAgICAgIHZhciBzb2wgPSBtaXNzaW9uRGF5IC0gMTMyO1xuICAgICAgICAgICAgc29sICo9IDg2NDAwLjA7XG4gICAgICAgICAgICBzb2wgLz0gODg3NzUuMjQ0MDk7XG4gICAgICAgICAgICBsYWJlbCA9IGxhYmVsICsgKFwiU29sOiBcIiArIHNvbC50b0ZpeGVkKDApKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICAgICAgdGhpcy5jdHguZm9udCA9IFwiMTJweCBBcmlhbFwiO1xuICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChsYWJlbCwgMTAsIDIwKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd05vcm1hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jdHguY2FudmFzLndpZHRoID0gdGhpcy5zY3JlZW5XO1xuICAgICAgICB0aGlzLmN0eC5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zY3JlZW5IO1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiMwMDBcIjtcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLnN1bi5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLmVhcnRoUGF0aC5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmRyYXdTZWxmKCk7XG4gICAgICAgIHRoaXMuc2hpcC5kcmF3U2VsZih0aGlzLmhvdmVyQWNjZWxQb2ludCk7XG4gICAgICAgIGlmICh0aGlzLmhvdmVyUGF0aFBvaW50SWR4ICE9IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IFwiI2ZmMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5zaGlwLmRyYXdUaHJ1c3RMaW5lKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHgpO1xuICAgICAgICAgICAgdmFyIGRheW51bSA9ICh0aGlzLmhvdmVyUGF0aFBvaW50SWR4ICogODY0MDApIC8gUE9JTlRTX1RJTUUgKyAxO1xuICAgICAgICAgICAgdmFyIGVtID0gdmVjdG9yXzEuZ2V0RGlzdGFuY2UodGhpcy5lYXJ0aFBhdGgucG9pbnRzW3RoaXMuaG92ZXJQYXRoUG9pbnRJZHhdLCB0aGlzLm1hcnNQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB2YXIgZWggPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLmVhcnRoUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMuc2hpcC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0pO1xuICAgICAgICAgICAgdmFyIGhtID0gdmVjdG9yXzEuZ2V0RGlzdGFuY2UodGhpcy5tYXJzUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMuc2hpcC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0pO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gXCIjZmZmZmZmXCI7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gXCIxMnB4IEFyaWFsXCI7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChcIkRheTogXCIgKyBkYXludW0udG9GaXhlZCgwKSwgMTAsIDIwKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRWFydGgtTWFyczogXCIgKyB0aGlzLmRpc3RJbmZvKGVtKSwgMTAsIDM2KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRWFydGgtSGVybWVzOiBcIiArIHRoaXMuZGlzdEluZm8oZWgpLCAxMCwgNTIpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJIZXJtZXMtTWFyczogXCIgKyB0aGlzLmRpc3RJbmZvKGhtKSwgMTAsIDY4KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWR4ID0gdGhpcy5ob3ZlclBhdGhQb2ludElkeDtcbiAgICAgICAgaWYgKGlkeCA8IDEpIHtcbiAgICAgICAgICAgIGlkeCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5lYXJ0aC5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLmVhcnRoUGF0aCwgaWR4KTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5tYXJzLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMubWFyc1BhdGgsIGlkeCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdQYXRoT2JqZWN0ID0gZnVuY3Rpb24gKHRvRHJhdywgcG9pbnRJZHgpIHtcbiAgICAgICAgdmFyIHN0b3BQb2ludCA9IHRvRHJhdy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgaWYgKHBvaW50SWR4ID4gc3RvcFBvaW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgeCA9IHRoaXMubW9kZWxUb1ZpZXdYKHRvRHJhdy5wb2ludHNbcG9pbnRJZHhdLlgpO1xuICAgICAgICB2YXIgeSA9IHRoaXMubW9kZWxUb1ZpZXdZKHRvRHJhdy5wb2ludHNbcG9pbnRJZHhdLlkpO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGV4cG9ydHMuRW5naW5lLmN0eC5hcmMoeCwgeSwgNSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICBleHBvcnRzLkVuZ2luZS5jdHguZmlsbCgpO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5kaXN0SW5mbyA9IGZ1bmN0aW9uIChkaXN0KSB7XG4gICAgICAgIHZhciBsaWdodFNlY29uZHMgPSBkaXN0IC8gMzAwMDAwO1xuICAgICAgICB2YXIgbGlnaHRNaW51dGVzID0gbGlnaHRTZWNvbmRzIC8gNjA7XG4gICAgICAgIGxpZ2h0U2Vjb25kcyA9IGxpZ2h0U2Vjb25kcyAlIDYwO1xuICAgICAgICByZXR1cm4gZGlzdC50b0ZpeGVkKDApICsgXCJrbSwgXCIgKyBsaWdodE1pbnV0ZXMudG9GaXhlZCgwKSArIFwibSBcIiArIGxpZ2h0U2Vjb25kcy50b0ZpeGVkKDApICsgXCJzXCI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gcmVzcG9uc2UgaXMgdW5zaWduZWQgOCBiaXQgaW50ZWdlclxuICAgICAgICAgICAgdmFyIGR2ID0gbmV3IERhdGFWaWV3KHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIG9mZiA9IDA7XG4gICAgICAgICAgICBvZmYgPSB0aGF0LmVhcnRoUGF0aC5sb2FkKGR2LCBvZmYpO1xuICAgICAgICAgICAgb2ZmID0gdGhhdC5tYXJzUGF0aC5sb2FkKGR2LCBvZmYpO1xuICAgICAgICAgICAgb2ZmID0gdGhhdC5zaGlwLmxvYWQoZHYsIG9mZik7XG4gICAgICAgICAgICB0aGF0LmRyYXdTZWxmKCk7XG4gICAgICAgIH07XG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLm1vdXNlTW92ZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHJlY3QgPSAkKFwiI2NhbnZhc1wiKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHggPSAoZXZ0LmNsaWVudFggfHwgZXZ0LnRvdWNoZXNbMF0uY2xpZW50WCkgLSByZWN0LmxlZnQ7XG4gICAgICAgIHZhciB5ID0gKGV2dC5jbGllbnRZIHx8IGV2dC50b3VjaGVzWzBdLmNsaWVudFkpIC0gcmVjdC50b3A7XG4gICAgICAgIC8vIGlmICh0aGlzLnVpTW9kZSA9PSBVSU1vZGUuQWRkaW5nUG9pbnQpIHtcbiAgICAgICAgdGhpcy5ob3ZlclBhdGhQb2ludElkeCA9IHRoaXMuc2hpcC5nZXROZWFyZXN0UG9pbnRJZHgoeCwgeSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaG92ZXJBY2NlbFBvaW50ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RBY2NlbFBvaW50KHgsIHkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIHRoaXMuZHJhd1NlbGYoKTtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLnBsYXliYWNrVGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMudWlNb2RlICE9IFVJTW9kZS5QbGF5YmFjaylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLnNoaXAuZ2V0U3RvcFBvaW50KCk7XG4gICAgICAgIGlmICh0aGlzLnBsYXliYWNrU3RlcElkeCA8PSBzdG9wSWR4KSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdTZWxmKCk7XG4gICAgICAgICAgICB0aGlzLnBsYXliYWNrU3RlcElkeCsrO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5wbGF5YmFja1RpY2soKTsgfSwgMzIwIC0gJChcIiNzcGVlZFwiKS52YWwoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlQYXVzZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLnBsYXlQYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudWlNb2RlICE9IFVJTW9kZS5QbGF5YmFjaykge1xuICAgICAgICAgICAgdGhpcy5wbGF5YmFja1N0ZXBJZHggPSAwO1xuICAgICAgICAgICAgdGhpcy51aU1vZGUgPSBVSU1vZGUuUGxheWJhY2s7XG4gICAgICAgICAgICB0aGlzLnBsYXliYWNrVGljaygpO1xuICAgICAgICAgICAgJChcIiNwYXVzZVwiKS5zaG93KCk7XG4gICAgICAgICAgICAkKFwiI3BsYXlcIikuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51aU1vZGUgPSBVSU1vZGUuSW5lcnQ7XG4gICAgICAgICAgICAkKFwiI3BsYXlcIikuc2hvdygpO1xuICAgICAgICAgICAgJChcIiNwYXVzZVwiKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUua2V5RG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGtleSA9IGV2dC5rZXk7XG4gICAgICAgIGlmIChrZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmhvdmVyQWNjZWxQb2ludCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5BZGRpbmdQb2ludDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09IFwiIFwiKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlQYXVzZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmtleVVwID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIga2V5ID0gZXZ0LmtleTtcbiAgICAgICAgaWYgKGtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggPSAtMTtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJBY2NlbFBvaW50ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudWlNb2RlID0gVUlNb2RlLk5vcm1hbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEVuZ2luZVNpbmdsZXRvbjtcbn0oKSk7XG47XG5leHBvcnRzLkVuZ2luZSA9IG5ldyBFbmdpbmVTaW5nbGV0b24oKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVuZ2luZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBvcmJpdF8xID0gcmVxdWlyZShcIi4vb3JiaXRcIik7XG52YXIgZW5naW5lXzEgPSByZXF1aXJlKFwiLi9lbmdpbmVcIik7XG52YXIgT0JPYmplY3QgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT0JPYmplY3Qoc2dwLCBwb3MsIHZlbCwgY29sb3IsIHNpemUsIG9yYml0ZWUpIHtcbiAgICAgICAgdGhpcy5zZ3AgPSBzZ3A7XG4gICAgICAgIHRoaXMucG9zID0gcG9zO1xuICAgICAgICB0aGlzLnZlbCA9IHZlbDtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLm9yYml0ZWUgPSBvcmJpdGVlO1xuICAgIH1cbiAgICBPQk9iamVjdC5wcm90b3R5cGUuaW5pdE9yYml0ZXIgPSBmdW5jdGlvbiAob3JiaXRlZSwgYXBvZ2VlRGlzdCwgYXBvZ2VlVmVsLCBhb3ApIHtcbiAgICAgICAgdGhpcy5vcmJpdGVlID0gb3JiaXRlZTtcbiAgICAgICAgdmFyIGFuZ2xlT2ZBcG9nZWUgPSBhb3AgLSAzLjE0MTU5O1xuICAgICAgICB0aGlzLnBvcy5zZXRSVGhldGEoYXBvZ2VlRGlzdCwgYW5nbGVPZkFwb2dlZSk7XG4gICAgICAgIHRoaXMucG9zLmFkZFZlY3RvcihvcmJpdGVlLnBvcyk7XG4gICAgICAgIHRoaXMudmVsLnNldCh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMudmVsLnJvdGF0ZSgtMy4xNDE1OSAvIDIuMCk7XG4gICAgICAgIHRoaXMudmVsLnNldExlbmd0aChhcG9nZWVWZWwpO1xuICAgICAgICB0aGlzLm9yYml0ID0gbmV3IG9yYml0XzEuT3JiaXQoMCwgMCwgMCwgMCk7XG4gICAgICAgIHRoaXMub3JiaXQuaW5pdFBWKG9yYml0ZWUuc2dwLCB0aGlzLnBvcywgdGhpcy52ZWwpO1xuICAgICAgICB0aGlzLm9yYml0LmNvbG9yID0gdGhpcy5jb2xvcjtcbiAgICB9O1xuICAgIE9CT2JqZWN0LnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9yYml0ZWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWNjID0gbmV3IHZlY3Rvcl8xLlZlY3RvcjtcbiAgICAgICAgYWNjLnNldCh0aGlzLm9yYml0ZWUucG9zKTtcbiAgICAgICAgYWNjLnN1YnRyYWN0VmVjdG9yKHRoaXMucG9zKTtcbiAgICAgICAgdmFyIGFjY0xlbiA9IChzZWNvbmRzICogdGhpcy5vcmJpdGVlLnNncCkgLyBhY2MuZ2V0TGVuZ3RoU3EoKTtcbiAgICAgICAgYWNjLnNldExlbmd0aChhY2NMZW4pO1xuICAgICAgICB0aGlzLnZlbC5hZGRWZWN0b3IoYWNjKTtcbiAgICAgICAgdmFyIHRvQWRkID0gbmV3IHZlY3Rvcl8xLlZlY3RvcjtcbiAgICAgICAgdG9BZGQuc2V0KHRoaXMudmVsKTtcbiAgICAgICAgdG9BZGQuc2NhbGFyTXVsdGlwbHkoc2Vjb25kcyk7XG4gICAgICAgIHRoaXMucG9zLmFkZFZlY3Rvcih0b0FkZCk7XG4gICAgfTtcbiAgICBPQk9iamVjdC5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9yYml0KSB7XG4gICAgICAgICAgICB0aGlzLm9yYml0LmRyYXdTZWxmKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHggPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9zLlgpO1xuICAgICAgICB2YXIgeSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb3MuWSk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5hcmMoeCwgeSwgdGhpcy5zaXplLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguZmlsbCgpO1xuICAgIH07XG4gICAgT0JPYmplY3QucHJvdG90eXBlLnJlY2FsY09yYml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9yYml0LmluaXRQVih0aGlzLm9yYml0LnUsIHRoaXMucG9zLCB0aGlzLnZlbCk7XG4gICAgfTtcbiAgICByZXR1cm4gT0JPYmplY3Q7XG59KCkpO1xuZXhwb3J0cy5PQk9iamVjdCA9IE9CT2JqZWN0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b2JqZWN0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlY3Rvcl8xID0gcmVxdWlyZShcIi4vdmVjdG9yXCIpO1xudmFyIGVuZ2luZV8xID0gcmVxdWlyZShcIi4vZW5naW5lXCIpO1xudmFyIE9yYml0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE9yYml0KHNncCwgZSwgYSwgdykge1xuICAgICAgICB0aGlzLmluaXQoc2dwLCBlLCBhLCB3KTtcbiAgICB9XG4gICAgT3JiaXQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoc2dwLCBlLCBhLCB3KSB7XG4gICAgICAgIHRoaXMudSA9IHNncDtcbiAgICAgICAgdGhpcy5lID0gZTtcbiAgICAgICAgdGhpcy5hID0gYTtcbiAgICAgICAgdGhpcy53ID0gdztcbiAgICAgICAgdGhpcy52YWxpZCA9IGUgPCAxLjAgJiYgYSA+IDAuMDtcbiAgICAgICAgdGhpcy5mMSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5mID0gdGhpcy5lICogdGhpcy5hO1xuICAgICAgICB0aGlzLmIgPSBNYXRoLnNxcnQodGhpcy5hICogdGhpcy5hIC0gdGhpcy5mICogdGhpcy5mKTtcbiAgICAgICAgdGhpcy5jZW50ZXIgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuY2VudGVyLnNldFJUaGV0YSh0aGlzLmYsIHRoaXMudyk7XG4gICAgICAgIHRoaXMuZjIgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuZjIuc2V0UlRoZXRhKDIgKiB0aGlzLmYsIHRoaXMudyk7XG4gICAgICAgIHRoaXMuZW5lcmd5ID0gLXRoaXMudSAvICgyLjAgKiB0aGlzLmEpO1xuICAgICAgICB0aGlzLmFwb2dlZSA9IHRoaXMuYSArIHRoaXMuZjtcbiAgICAgICAgdGhpcy5wZXJpZ2VlID0gdGhpcy5hIC0gdGhpcy5mO1xuICAgICAgICB0aGlzLm9yYml0QXJlYSA9IE1hdGguUEkgKiB0aGlzLmEgKiB0aGlzLmI7XG4gICAgICAgIHRoaXMuY2FsY0RyYXdQb2ludHMoKTtcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5pbml0UFYgPSBmdW5jdGlvbiAoc2dwLCBvcmJpdGVyUG9zLCBvcmJpdGVyVmVsKSB7XG4gICAgICAgIHRoaXMuZjEgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMudSA9IHNncDtcbiAgICAgICAgdGhpcy52YWxpZCA9IHRydWU7XG4gICAgICAgIHZhciByZWxhdGl2ZVBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgcmVsYXRpdmVQb3Muc2V0KG9yYml0ZXJQb3MpO1xuICAgICAgICByZWxhdGl2ZVBvcy5zY2FsYXJNdWx0aXBseSgtMSk7XG4gICAgICAgIHZhciByID0gcmVsYXRpdmVQb3MuZ2V0TGVuZ3RoKCk7XG4gICAgICAgIGlmIChyIDw9IDAuMCkge1xuICAgICAgICAgICAgdGhpcy52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2ID0gb3JiaXRlclZlbC5nZXRMZW5ndGgoKTtcbiAgICAgICAgdGhpcy5lbmVyZ3kgPSAodiAqIHYgLyAyLjApIC0gKHRoaXMudSAvIHIpO1xuICAgICAgICBpZiAodGhpcy5lbmVyZ3kgPj0gMC4wKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hID0gLXRoaXMudSAvICgyLjAgKiB0aGlzLmVuZXJneSk7XG4gICAgICAgIHZhciBkID0gMi4wICogdGhpcy5hIC0gcjtcbiAgICAgICAgdmFyIG9yYml0ZXJBbmdsZSA9IHJlbGF0aXZlUG9zLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciB2ZWxBbmdsZSA9IG9yYml0ZXJWZWwuZ2V0QW5nbGUoKTtcbiAgICAgICAgdmFyIHRoZXRhID0gdmVjdG9yXzEuYW5nbGVEaWZmKHZlbEFuZ2xlLCBvcmJpdGVyQW5nbGUpO1xuICAgICAgICB2YXIgcGhpID0gTWF0aC5QSSAtIHRoZXRhO1xuICAgICAgICB0aGlzLmYyLnNldChvcmJpdGVyVmVsKTtcbiAgICAgICAgdGhpcy5mMi5zZXRMZW5ndGgoZCk7XG4gICAgICAgIHRoaXMuZjIucm90YXRlKHBoaSk7XG4gICAgICAgIHRoaXMuZjIuYWRkVmVjdG9yKG9yYml0ZXJQb3MpO1xuICAgICAgICB0aGlzLncgPSB0aGlzLmYyLmdldEFuZ2xlKCk7XG4gICAgICAgIHRoaXMuZiA9IHRoaXMuZjIuZ2V0TGVuZ3RoKCkgLyAyO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLmYgLyB0aGlzLmE7XG4gICAgICAgIHRoaXMuaW5pdChzZ3AsIHRoaXMuZSwgdGhpcy5hLCB0aGlzLncpO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmNhbGNEcmF3UG9pbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeFN0ZXAgPSAyLjAgKiBlbmdpbmVfMS5FbmdpbmUua21QZXJQaXhlbDtcbiAgICAgICAgdmFyIG51bVBvaW50cyA9IE1hdGgucm91bmQoKDIuMCAqIHRoaXMuYSkgLyB4U3RlcCkgKyAyOyAvLyB0aGUgKzIgaXMgZm9yIHJvdW5kaW5nIHNhZmV0eVxuICAgICAgICB2YXIgbWF4RHJhd1BvaW50cyA9IG51bVBvaW50cyAqIDI7XG4gICAgICAgIHRoaXMuZHJhd1BvaW50cyA9IFtdO1xuICAgICAgICB2YXIgZmlyc3RIYWxmID0gW107XG4gICAgICAgIHZhciBzZWNvbmRIYWxmID0gW107XG4gICAgICAgIHZhciBoYWxmUG9zID0gMDtcbiAgICAgICAgdmFyIHggPSAtdGhpcy5hO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGFscGhhID0gMS4wIC0gKHggKiB4KSAvICh0aGlzLmEgKiB0aGlzLmEpO1xuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLnNxcnQodGhpcy5iICogdGhpcy5iICogYWxwaGEpO1xuICAgICAgICAgICAgaWYgKGhhbGZQb3MgPj0gbnVtUG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJPb3BzXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd29yayA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoeCwgeSk7XG4gICAgICAgICAgICB3b3JrLnJvdGF0ZSh0aGlzLncpO1xuICAgICAgICAgICAgd29yay5hZGRWZWN0b3IodGhpcy5jZW50ZXIpO1xuICAgICAgICAgICAgZmlyc3RIYWxmW2hhbGZQb3NdID0ge1xuICAgICAgICAgICAgICAgIFg6IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1god29yay5YKSxcbiAgICAgICAgICAgICAgICBZOiBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHdvcmsuWSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3b3JrID0gbmV3IHZlY3Rvcl8xLlZlY3Rvcih4LCAteSk7XG4gICAgICAgICAgICB3b3JrLnJvdGF0ZSh0aGlzLncpO1xuICAgICAgICAgICAgd29yay5hZGRWZWN0b3IodGhpcy5jZW50ZXIpO1xuICAgICAgICAgICAgc2Vjb25kSGFsZltoYWxmUG9zXSA9IHtcbiAgICAgICAgICAgICAgICBYOiBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHdvcmsuWCksXG4gICAgICAgICAgICAgICAgWTogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh3b3JrLlkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFsZlBvcysrO1xuICAgICAgICAgICAgaWYgKHggPT0gdGhpcy5hKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4ICs9IHhTdGVwO1xuICAgICAgICAgICAgaWYgKHggPiB0aGlzLmEpIHtcbiAgICAgICAgICAgICAgICB4ID0gdGhpcy5hO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd1BvaW50cyA9IGZpcnN0SGFsZjtcbiAgICAgICAgdGhpcy5kcmF3UG9pbnRzLnB1c2guYXBwbHkoc2Vjb25kSGFsZi5yZXZlcnNlKCkpO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMudmFsaWQgfHwgIXRoaXMuZHJhd1BvaW50cyB8fCB0aGlzLmRyYXdQb2ludHMubGVuZ3RoIDwgMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIF9hID0gdGhpcy5kcmF3UG9pbnRzWzBdLCBsYXN0WCA9IF9hLlgsIGxhc3RZID0gX2EuWTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYiA9IHRoaXMuZHJhd1BvaW50czsgX2kgPCBfYi5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gX2JbX2ldO1xuICAgICAgICAgICAgdmFyIHRoaXNYID0gcC5YLCB0aGlzWSA9IHAuWTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTGluZSAoXCIgKyBsYXN0WCArIFwiLCBcIiArIGxhc3RZICsgXCIpLShcIiArIHRoaXNYICsgXCIsIFwiICsgdGhpc1kgKyBcIilcIik7XG4gICAgICAgICAgICBfYyA9IFt0aGlzWCwgdGhpc1ldLCBsYXN0WCA9IF9jWzBdLCBsYXN0WSA9IF9jWzFdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBfYztcbiAgICB9O1xuICAgIE9yYml0LnByb3RvdHlwZS5nZXRSID0gZnVuY3Rpb24gKHRoZXRhKSB7XG4gICAgICAgIGlmICghdGhpcy52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG51bWVyYXRvciA9IHRoaXMuYSAqICgxLjAgLSB0aGlzLmUgKiB0aGlzLmUpO1xuICAgICAgICB2YXIgZGVub21pbmF0b3IgPSAxLjAgLSB0aGlzLmUgKiAoTWF0aC5jb3ModGhldGEgLSB0aGlzLncpKTtcbiAgICAgICAgcmV0dXJuIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmdldFBvcyA9IGZ1bmN0aW9uICh0aGV0YSkge1xuICAgICAgICB2YXIgcG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2YXIgciA9IHRoaXMuZ2V0Uih0aGV0YSk7XG4gICAgICAgIHBvcy5zZXRSVGhldGEociwgdGhldGEpO1xuICAgICAgICByZXR1cm4gcG9zO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmdldFZlbCA9IGZ1bmN0aW9uICh0aGV0YSkge1xuICAgICAgICB2YXIgcG9zID0gdGhpcy5nZXRQb3ModGhldGEpO1xuICAgICAgICB2YXIgciA9IHBvcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgdmFyIHZTcXVhcmVkID0gMi4wICogKHRoaXMuZW5lcmd5ICsgdGhpcy51IC8gcik7XG4gICAgICAgIHZhciB2ID0gTWF0aC5zcXJ0KHZTcXVhcmVkKTtcbiAgICAgICAgdmFyIGFuZ2xlVG9GMSA9IE1hdGguUEkgKyB0aGV0YTtcbiAgICAgICAgdmFyIGxvb2tBdEYyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICBsb29rQXRGMi5zZXQodGhpcy5mMik7XG4gICAgICAgIGxvb2tBdEYyLnN1YnRyYWN0VmVjdG9yKHBvcyk7XG4gICAgICAgIHZhciBhbmdsZVRvRjIgPSBsb29rQXRGMi5nZXRBbmdsZSgpO1xuICAgICAgICB2YXIgZGlmZiA9IHZlY3Rvcl8xLmFuZ2xlRGlmZihhbmdsZVRvRjEsIGFuZ2xlVG9GMik7XG4gICAgICAgIHZhciBhbmdsZSA9IGFuZ2xlVG9GMSArIGRpZmYgLyAyLjA7XG4gICAgICAgIHZhciB2ZWxBbmdsZSA9IGFuZ2xlICsgKE1hdGguUEkgLyAyLjApO1xuICAgICAgICB2YXIgb3V0ID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICBvdXQuc2V0UlRoZXRhKHYsIHZlbEFuZ2xlKTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBPcmJpdDtcbn0oKSk7XG5leHBvcnRzLk9yYml0ID0gT3JiaXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmJpdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2ZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3ZlY3RvclwiKTtcbnZhciBlbmdpbmVfMSA9IHJlcXVpcmUoXCIuL2VuZ2luZVwiKTtcbnZhciBBY2NUeXBlO1xuKGZ1bmN0aW9uIChBY2NUeXBlKSB7XG4gICAgQWNjVHlwZVtBY2NUeXBlW1wiTm9ybWFsXCJdID0gMF0gPSBcIk5vcm1hbFwiO1xuICAgIEFjY1R5cGVbQWNjVHlwZVtcIlJlZGlyZWN0XCJdID0gMV0gPSBcIlJlZGlyZWN0XCI7XG4gICAgQWNjVHlwZVtBY2NUeXBlW1wiU3RvcFRyYWNlXCJdID0gMl0gPSBcIlN0b3BUcmFjZVwiO1xufSkoQWNjVHlwZSB8fCAoQWNjVHlwZSA9IHt9KSk7XG47XG47XG52YXIgUEFUSF9BQ0NFTEVSQVRJT04gPSAwLjAwMDAwMjtcbnZhciBQT0lOVFNfVElNRSA9IDg2NDAwLjA7XG52YXIgRkFUQUxfU1VOX0FQUFJPQUNIID0gMzUwMDAwMDAuMDtcbnZhciBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIID0gNTA7XG52YXIgUGF0aCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYXRoKCkge1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvblBvaW50cyA9IFtdO1xuICAgICAgICB0aGlzLnBvaW50cyA9IFtdO1xuICAgIH1cbiAgICBQYXRoLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKG9yYml0ZWUsIHBvcywgdmVsLCBjb2xvciwgc2l6ZSkge1xuICAgICAgICB0aGlzLmluaXROb0FjYyhvcmJpdGVlLCBwb3MsIHZlbCwgY29sb3IsIHNpemUpO1xuICAgICAgICB2YXIgbmV3UG9pbnQgPSB0aGlzLmNyZWF0ZUFjY2VsZXJhdGlvblBvaW50KDApO1xuICAgICAgICBuZXdQb2ludC5hbmdsZSA9IE1hdGguUEkgLyAyLjA7XG4gICAgICAgIG5ld1BvaW50Lm1hZyA9IFBBVEhfQUNDRUxFUkFUSU9OO1xuICAgICAgICB0aGlzLmNhbGNQb2ludHMoKTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmluaXROb0FjYyA9IGZ1bmN0aW9uIChvcmJpdGVlLCBwb3MsIHZlbCwgY29sb3IsIHNpemUpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLm9yYml0ZWUgPSBvcmJpdGVlO1xuICAgICAgICB0aGlzLnN0YXJ0UG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLnN0YXJ0UG9zLnNldChwb3MpO1xuICAgICAgICB0aGlzLnN0YXJ0VmVsID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLnN0YXJ0VmVsLnNldCh2ZWwpO1xuICAgICAgICB0aGlzLmNhbGNQb2ludHMoKTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmluaXROb0FjY09yYml0ZXJBbmdsZSA9IGZ1bmN0aW9uIChvcmJpdGVyLCBhbmdsZSkge1xuICAgICAgICBhbmdsZSA9IC1NYXRoLlBJIC8gMi4wIC0gYW5nbGU7XG4gICAgICAgIHZhciBvcmJpdGVlID0gb3JiaXRlci5vcmJpdGVlO1xuICAgICAgICB2YXIgcG9zID0gb3JiaXRlci5vcmJpdC5nZXRQb3MoYW5nbGUpO1xuICAgICAgICB2YXIgdmVsID0gb3JiaXRlci5vcmJpdC5nZXRWZWwoYW5nbGUpO1xuICAgICAgICByZXR1cm4gdGhpcy5pbml0Tm9BY2Mob3JiaXRlZSwgcG9zLCB2ZWwsIG9yYml0ZXIub3JiaXQuY29sb3IsIG9yYml0ZXIuc2l6ZSk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5yZW1vdmVBY2NlbGVyYXRpb25Qb2ludCA9IGZ1bmN0aW9uIChhcCkge1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvblBvaW50cyA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLmZpbHRlcihmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogIT09IGFwOyB9KTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmFkanVzdEFjY2VsZXJhdGlvblBvaW50ID0gZnVuY3Rpb24gKGFwLCBteCwgbXksIG5ld01hZykge1xuICAgICAgICB2YXIgcG9pbnRJZHggPSBhcC5wb2ludElkeDtcbiAgICAgICAgdmFyIGFwWCA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1godGhpcy5wb2ludHNbcG9pbnRJZHhdLlgpO1xuICAgICAgICB2YXIgYXBZID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1twb2ludElkeF0uWSk7XG4gICAgICAgIHZhciBuZXdMaW5lID0gbmV3IHZlY3Rvcl8xLlZlY3RvcihteCAtIGFwWCwgbXkgLSBhcFkpO1xuICAgICAgICB2YXIgdW5hZGp1c3RlZEFuZyA9IG5ld0xpbmUuZ2V0QW5nbGUoKTtcbiAgICAgICAgdmFyIGdyYXYgPSB0aGlzLmdldEdyYXZGb3JQb2ludChwb2ludElkeCk7XG4gICAgICAgIHZhciBncmF2QW5nID0gZ3Jhdi5nZXRBbmdsZSgpO1xuICAgICAgICBhcC5hbmdsZSA9IHZlY3Rvcl8xLmFuZ2xlRGlmZihncmF2QW5nLCB1bmFkanVzdGVkQW5nKTtcbiAgICAgICAgYXAubWFnID0gbmV3TWFnO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0R3JhdkZvclBvaW50ID0gZnVuY3Rpb24gKHBvaW50SWR4KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHJlc3VsdC5zZXQodGhpcy5vcmJpdGVlLnBvcyk7XG4gICAgICAgIGlmIChwb2ludElkeCA9PSAwKSB7XG4gICAgICAgICAgICByZXN1bHQuc3VidHJhY3RWZWN0b3IodGhpcy5zdGFydFBvcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQuc3VidHJhY3RWZWN0b3IodGhpcy5wb2ludHNbcG9pbnRJZHggLSAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmNyZWF0ZUFjY2VsZXJhdGlvblBvaW50ID0gZnVuY3Rpb24gKHBvaW50SWR4KSB7XG4gICAgICAgIHZhciBhcCA9IHsgcG9pbnRJZHg6IHBvaW50SWR4IH07XG4gICAgICAgIGlmICh0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgdGhydXN0ID0gdGhpcy5nZXRUaHJ1c3RGb3JQb2ludChwb2ludElkeCk7XG4gICAgICAgICAgICBhcC5tYWcgPSB0aHJ1c3QuZ2V0TGVuZ3RoKCk7XG4gICAgICAgICAgICB2YXIgZ3JhdiA9IHRoaXMuZ2V0R3JhdkZvclBvaW50KHBvaW50SWR4KTtcbiAgICAgICAgICAgIGFwLmFuZ2xlID0gdmVjdG9yXzEuYW5nbGVEaWZmKGdyYXYuZ2V0QW5nbGUoKSwgdGhydXN0LmdldEFuZ2xlKCkpO1xuICAgICAgICB9XG4gICAgICAgIGFwLnR5cGUgPSBBY2NUeXBlLk5vcm1hbDtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMucHVzaChhcCk7XG4gICAgICAgIHJldHVybiBhcDtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldFRocnVzdEZvclBvaW50ID0gZnVuY3Rpb24gKHBvaW50SWR4KSB7XG4gICAgICAgIGlmICh0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBncmF2ID0gdGhpcy5nZXRHcmF2Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICB2YXIgYXA7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciB0aGlzQXAgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAodGhpc0FwLnBvaW50SWR4ID4gcG9pbnRJZHgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFwID0gdGhpc0FwO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXApIHtcbiAgICAgICAgICAgIGFwID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHNbdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFjYyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgYWNjLnNldChncmF2KTtcbiAgICAgICAgYWNjLnJvdGF0ZShhcC5hbmdsZSk7XG4gICAgICAgIGFjYy5zZXRMZW5ndGgoYXAubWFnKTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmNhbGNQb2ludHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHBvcy5zZXQodGhpcy5zdGFydFBvcyk7XG4gICAgICAgIHZhciB2ZWwgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZlbC5zZXQodGhpcy5zdGFydFZlbCk7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgaWYgKCF0aGlzLnBvaW50c1swXSkge1xuICAgICAgICAgICAgdGhpcy5wb2ludHNbMF0gPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wb2ludHNbMF0uc2V0KHBvcyk7XG4gICAgICAgIHZhciBoYWx0ID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBvaW50c1tpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRzW2ldID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhbHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50c1tpXS5zZXQodGhpcy5wb2ludHNbaSAtIDFdKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBncmF2ID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICAgICAgZ3Jhdi5zZXQodGhpcy5vcmJpdGVlLnBvcyk7XG4gICAgICAgICAgICBncmF2LnN1YnRyYWN0VmVjdG9yKHBvcyk7XG4gICAgICAgICAgICB2YXIgZ3JhdkFjY0xlbiA9IChQT0lOVFNfVElNRSAqIHRoaXMub3JiaXRlZS5zZ3ApIC8gZ3Jhdi5nZXRMZW5ndGhTcSgpO1xuICAgICAgICAgICAgZ3Jhdi5zZXRMZW5ndGgoZ3JhdkFjY0xlbik7XG4gICAgICAgICAgICB2ZWwuYWRkVmVjdG9yKGdyYXYpO1xuICAgICAgICAgICAgdmFyIHRocnVzdEFjYyA9IHRoaXMuZ2V0VGhydXN0Rm9yUG9pbnQoaSk7XG4gICAgICAgICAgICB0aHJ1c3RBY2Muc2NhbGFyTXVsdGlwbHkoUE9JTlRTX1RJTUUpO1xuICAgICAgICAgICAgdmVsLmFkZFZlY3Rvcih0aHJ1c3RBY2MpO1xuICAgICAgICAgICAgdmFyIGFwO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgIGFwID0gX2FbX2ldO1xuICAgICAgICAgICAgICAgIGlmIChhcC5wb2ludElkeCAhPSBpKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZiAoYXAudHlwZSA9PSBBY2NUeXBlLlJlZGlyZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZlbC5zZXRSVGhldGEodmVsLmdldExlbmd0aCgpLCB0aHJ1c3RBY2MuZ2V0QW5nbGUoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdvcmsgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgICAgICB3b3JrLnNldCh2ZWwpO1xuICAgICAgICAgICAgd29yay5zY2FsYXJNdWx0aXBseShQT0lOVFNfVElNRSk7XG4gICAgICAgICAgICBwb3MuYWRkVmVjdG9yKHdvcmspO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBvaW50c1tpXSkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRzW2ldID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wb2ludHNbaV0uc2V0KHBvcyk7XG4gICAgICAgICAgICBpZiAodmVjdG9yXzEuZ2V0RGlzdGFuY2UodGhpcy5wb2ludHNbaV0sIHRoaXMub3JiaXRlZS5wb3MpIDwgRkFUQUxfU1VOX0FQUFJPQUNIKSB7XG4gICAgICAgICAgICAgICAgaGFsdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmRyYXdQcm9ncmVzc2l2ZVBhdGggPSBmdW5jdGlvbiAocG9pbnRJZHgpIHtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICBpZiAoc3RvcElkeCA+IHBvaW50SWR4KSB7XG4gICAgICAgICAgICBzdG9wSWR4ID0gcG9pbnRJZHg7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coXCJEcmF3IHByb2cgcGF0aCB1bnRpbCBcIiArIHN0b3BJZHgpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RvcElkeDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgeCA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1godGhpcy5wb2ludHNbaV0uWCk7XG4gICAgICAgICAgICB2YXIgeSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbaV0uWSk7XG4gICAgICAgICAgICB2YXIgZHJhdyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGkgIT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciB0aHJ1c3QgPSB0aGlzLmdldFRocnVzdEZvclBvaW50KGkpO1xuICAgICAgICAgICAgICAgIGlmICh0aHJ1c3QuZ2V0TGVuZ3RoKCkgIT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyYXcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA+IDE3MClcbiAgICAgICAgICAgICAgICAgICAgZHJhdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZHJhdykge1xuICAgICAgICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1vdmUgdG8gXCIgKyB4ICsgXCIsXCIgKyB5KTtcbiAgICAgICAgfVxuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LnN0cm9rZSgpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbiAoc2VsKSB7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgdmFyIGxhc3RYO1xuICAgICAgICB2YXIgbGFzdFk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdG9wSWR4OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpID4gdGhpcy5wb2ludHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgeCA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1godGhpcy5wb2ludHNbaV0uWCk7XG4gICAgICAgICAgICB2YXIgeSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbaV0uWSk7XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubW92ZVRvKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguc3Ryb2tlKCk7XG4gICAgICAgIHZhciBhcDtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXAgPSBfYVtfaV07XG4gICAgICAgICAgICB2YXIgaSA9IGFwLnBvaW50SWR4O1xuICAgICAgICAgICAgdmFyIHggPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2ldLlgpO1xuICAgICAgICAgICAgdmFyIHkgPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW2ldLlkpO1xuICAgICAgICAgICAgaWYgKGFwID09IHNlbCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguZmlsbFN0eWxlID0gXCIjZmZmZjAwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhcC50eXBlID09IEFjY1R5cGUuUmVkaXJlY3QpIHtcbiAgICAgICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGxTdHlsZSA9IFwiIzAwMDBmZlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5maWxsU3R5bGUgPSBcIiNmZjAwMDBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmFyYyh4LCB5LCB0aGlzLnNpemUsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5kcmF3VGhydXN0TGluZShpKTtcbiAgICAgICAgICAgIGlmIChhcC50eXBlID09IEFjY1R5cGUuU3RvcFRyYWNlKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5kcmF3VGhydXN0TGluZSA9IGZ1bmN0aW9uIChwb2ludElEWCkge1xuICAgICAgICBpZiAocG9pbnRJRFggPT0gLTEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB2ZWMgPSB0aGlzLmdldFRocnVzdEZvclBvaW50KHBvaW50SURYKTtcbiAgICAgICAgaWYgKHZlYy5nZXRMZW5ndGgoKSA9PSAwLjApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZlYy5zZXRMZW5ndGgoRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCk7XG4gICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1twb2ludElEWF0uWCk7XG4gICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1twb2ludElEWF0uWSk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguc3Ryb2tlU3R5bGUgPSBcIiNmZmZcIjtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubGluZVRvKHggKyB2ZWMuWCwgeSArIHZlYy5ZKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2UoKTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldFN0b3BQb2ludCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGhpZ2hlc3RJZHggPSAwO1xuICAgICAgICB2YXIgYXA7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFwID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKGFwLnR5cGUgPT0gQWNjVHlwZS5TdG9wVHJhY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXAucG9pbnRJZHg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDkwMCAtIDE7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5nZXROZWFyZXN0UG9pbnRJZHggPSBmdW5jdGlvbiAodmlld1gsIHZpZXdZKSB7XG4gICAgICAgIHZhciBNQVhfRElTVCA9IERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggKyBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIIC8gMTA7XG4gICAgICAgIHZhciBNQVhfRElTVF9TUSA9IE1BWF9ESVNUICogTUFYX0RJU1Q7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgdmFyIGNsb3Nlc3RJZHggPSAtMTtcbiAgICAgICAgdmFyIGNsb3Nlc3REaXN0U3EgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdG9wSWR4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkeCA9IHZpZXdYIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1tpXS5YKTtcbiAgICAgICAgICAgIHZhciBkeSA9IHZpZXdZIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1tpXS5ZKTtcbiAgICAgICAgICAgIHZhciBkaXN0U3EgPSBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICAgICAgICAgIGlmIChkaXN0U3EgPCBNQVhfRElTVF9TUSkge1xuICAgICAgICAgICAgICAgIGlmICgoY2xvc2VzdElkeCA9PSAtMSkgfHwgKGRpc3RTcSA8IGNsb3Nlc3REaXN0U3EpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb3Nlc3REaXN0U3EgPSBkaXN0U3E7XG4gICAgICAgICAgICAgICAgICAgIGNsb3Nlc3RJZHggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvc2VzdElkeDtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldE5lYXJlc3RBY2NlbFBvaW50ID0gZnVuY3Rpb24gKHZpZXdYLCB2aWV3WSkge1xuICAgICAgICB2YXIgTUFYX0RJU1QgPSBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIICsgRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCAvIDEwO1xuICAgICAgICB2YXIgTUFYX0RJU1RfU1EgPSBNQVhfRElTVCAqIE1BWF9ESVNUO1xuICAgICAgICB2YXIgc3RvcElkeCA9IHRoaXMuZ2V0U3RvcFBvaW50KCk7XG4gICAgICAgIHZhciBjbG9zZXN0QXA7XG4gICAgICAgIHZhciBjbG9zZXN0RGlzdFNxID0gMDtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgICAgIHZhciBkeCA9IHZpZXdYIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1thcC5wb2ludElkeF0uWCk7XG4gICAgICAgICAgICB2YXIgZHkgPSB2aWV3WSAtIGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbYXAucG9pbnRJZHhdLlkpO1xuICAgICAgICAgICAgdmFyIGRpc3RTcSA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgICAgICAgaWYgKGRpc3RTcSA8IE1BWF9ESVNUX1NRKSB7XG4gICAgICAgICAgICAgICAgaWYgKCghY2xvc2VzdEFwKSB8fCAoZGlzdFNxIDwgY2xvc2VzdERpc3RTcSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3RTcSA9IGRpc3RTcTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdEFwID0gYXA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXN0QXA7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKGR2LCBvZmYpIHtcbiAgICAgICAgdGhpcy5zdGFydFBvcy5YID0gZHYuZ2V0RmxvYXQ2NChvZmYsIHRydWUpO1xuICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgdGhpcy5zdGFydFBvcy5ZID0gZHYuZ2V0RmxvYXQ2NChvZmYsIHRydWUpO1xuICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgdGhpcy5zdGFydFZlbC5YID0gZHYuZ2V0RmxvYXQ2NChvZmYsIHRydWUpO1xuICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgdGhpcy5zdGFydFZlbC5ZID0gZHYuZ2V0RmxvYXQ2NChvZmYsIHRydWUpO1xuICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMgPSBbXTtcbiAgICAgICAgdmFyIG51bVBvaW50cyA9IGR2LmdldEludDMyKG9mZik7XG4gICAgICAgIG9mZiArPSA0O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVBvaW50czsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYXAgPSB7fTtcbiAgICAgICAgICAgIGFwLnBvaW50SWR4ID0gZHYuZ2V0SW50MzIob2ZmKTtcbiAgICAgICAgICAgIG9mZiArPSA0O1xuICAgICAgICAgICAgYXAudHlwZSA9IGR2LmdldEludDMyKG9mZik7XG4gICAgICAgICAgICBvZmYgKz0gNDtcbiAgICAgICAgICAgIGFwLmFuZ2xlID0gZHYuZ2V0RmxvYXQ2NChvZmYsIHRydWUpO1xuICAgICAgICAgICAgb2ZmICs9IDg7XG4gICAgICAgICAgICBhcC5tYWcgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLnB1c2goYXApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2FsY1BvaW50cygpO1xuICAgICAgICByZXR1cm4gb2ZmO1xuICAgIH07XG4gICAgcmV0dXJuIFBhdGg7XG59KCkpO1xuZXhwb3J0cy5QYXRoID0gUGF0aDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhdGguanMubWFwIiwiRW5naW5lID0gcmVxdWlyZShcIi4vZW5naW5lXCIpLkVuZ2luZTtcbiQoZnVuY3Rpb24oKSB7XG4gIEVuZ2luZS5pbml0KCQoXCIjY2FudmFzXCIpKTtcbiAgY29uc29sZS5sb2coRW5naW5lKTtcbiAgRW5naW5lLmRyYXdTZWxmKCk7XG4gICQoXCIjb3JpZ2luYWxcIikuY2xpY2soZnVuY3Rpb24oKSB7IEVuZ2luZS5sb2FkKFwib3JpZ2luYWwuc2F2XCIpOyB9KVxuICAkKFwiI3NvbDZhYm9ydFwiKS5jbGljayhmdW5jdGlvbigpIHsgRW5naW5lLmxvYWQoXCJzb2w2YWJvcnQuc2F2XCIpOyB9KVxuICAkKFwiI2ZpbmFsXCIpLmNsaWNrKGZ1bmN0aW9uKCkgeyBFbmdpbmUubG9hZChcImZpbmFsLnNhdlwiKTsgfSlcbiAgJChcIiNwYXVzZVwiKS5oaWRlKCk7XG4gICQoXCIjcGxheSwjcGF1c2VcIikuY2xpY2soZnVuY3Rpb24oKSB7IEVuZ2luZS5wbGF5UGF1c2UoKTsgfSlcblxufSk7XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFZlY3RvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWZWN0b3IoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0gdm9pZCAwKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB2b2lkIDApIHsgeSA9IDA7IH1cbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgICAgdGhpcy5YID0geDtcbiAgICAgICAgdGhpcy5ZID0geTtcbiAgICB9XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodikgeyB0aGlzLlggPSB2Llg7IHRoaXMuWSA9IHYuWTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmFkZFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCArPSB2Llg7IHRoaXMuWSArPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zdWJ0cmFjdFZlY3RvciA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCAtPSB2Llg7IHRoaXMuWSAtPSB2Llk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zY2FsYXJNdWx0aXBseSA9IGZ1bmN0aW9uIChuKSB7IHRoaXMuWCAqPSBuOyB0aGlzLlkgKj0gbjsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmdldExlbmd0aFNxID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5YICogdGhpcy5YICsgdGhpcy5ZICogdGhpcy5ZOyB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRMZW5ndGggPSBmdW5jdGlvbiAobikge1xuICAgICAgICB2YXIgbGVuID0gTWF0aC5zcXJ0KHRoaXMuZ2V0TGVuZ3RoU3EoKSk7XG4gICAgICAgIHRoaXMuc2NhbGFyTXVsdGlwbHkobiAvIGxlbik7XG4gICAgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmcpIHtcbiAgICAgICAgX2EgPSBbdGhpcy5YICogTWF0aC5jb3MoYW5nKSAtIHRoaXMuWSAqIE1hdGguc2luKGFuZyksXG4gICAgICAgICAgICB0aGlzLlggKiBNYXRoLnNpbihhbmcpICsgdGhpcy5ZICogTWF0aC5jb3MoYW5nKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5zZXRSVGhldGEgPSBmdW5jdGlvbiAociwgdGhldGEpIHtcbiAgICAgICAgX2EgPSBbciAqIE1hdGguY29zKHRoZXRhKSwgciAqIE1hdGguc2luKHRoZXRhKV0sIHRoaXMuWCA9IF9hWzBdLCB0aGlzLlkgPSBfYVsxXTtcbiAgICAgICAgdmFyIF9hO1xuICAgIH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5nZXRBbmdsZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1hdGguYXRhbjIodGhpcy5ZLCB0aGlzLlgpOyB9O1xuICAgIHJldHVybiBWZWN0b3I7XG59KCkpO1xuZXhwb3J0cy5WZWN0b3IgPSBWZWN0b3I7XG5mdW5jdGlvbiBnZXREaXN0YW5jZShhLCBiKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCgoYS5YIC0gYi5YKSAqIChhLlggLSBiLlgpICsgKGEuWSAtIGIuWSkgKiAoYS5ZIC0gYi5ZKSk7XG59XG5leHBvcnRzLmdldERpc3RhbmNlID0gZ2V0RGlzdGFuY2U7XG5mdW5jdGlvbiBhbmdsZURpZmYoYjFSYWQsIGIyUmFkKSB7XG4gICAgdmFyIGIxeSA9IE1hdGguY29zKGIxUmFkKTtcbiAgICB2YXIgYjF4ID0gTWF0aC5zaW4oYjFSYWQpO1xuICAgIHZhciBiMnkgPSBNYXRoLmNvcyhiMlJhZCk7XG4gICAgdmFyIGIyeCA9IE1hdGguc2luKGIyUmFkKTtcbiAgICB2YXIgY3Jvc3NwID0gYjF5ICogYjJ4IC0gYjJ5ICogYjF4O1xuICAgIHZhciBkb3RwID0gYjF4ICogYjJ4ICsgYjF5ICogYjJ5O1xuICAgIGlmIChjcm9zc3AgPiAwLilcbiAgICAgICAgcmV0dXJuIE1hdGguYWNvcyhkb3RwKTtcbiAgICByZXR1cm4gLU1hdGguYWNvcyhkb3RwKTtcbn1cbmV4cG9ydHMuYW5nbGVEaWZmID0gYW5nbGVEaWZmO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dmVjdG9yLmpzLm1hcCJdfQ==
