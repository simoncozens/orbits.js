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
        var narrowest = this.screenW < this.screenH ? this.screenW : this.screenH;
        this.kmPerPixel = 1.2 * width / narrowest;
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
        this.setupCanvas();
        if (this.uiMode == UIMode.Playback) {
            this.drawPlayback();
        }
        else {
            this.drawNormal();
        }
    };
    EngineSingleton.prototype.setupCanvas = function () {
        this.ctx.canvas.width = this.screenW;
        this.ctx.canvas.height = this.screenH;
        this.ctx.clearRect(0, 0, this.screenW, this.screenH);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.screenW, this.screenH);
        this.sun.drawSelf();
        this.earthPath.drawSelf();
        this.marsPath.drawSelf();
    };
    EngineSingleton.prototype.drawPlayback = function () {
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
        for (var i = 1; i <= stopIdx; i++) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZW5naW5lLmpzIiwic3JjL29iamVjdC5qcyIsInNyYy9vcmJpdC5qcyIsInNyYy9wYXRoLmpzIiwic3JjL3N0YXJ0LmpzIiwic3JjL3ZlY3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgb2JqZWN0XzEgPSByZXF1aXJlKFwiLi9vYmplY3RcIik7XG52YXIgcGF0aF8xID0gcmVxdWlyZShcIi4vcGF0aFwiKTtcbnZhciBNQVJTX0FQT0dFRSA9IDI0OTIwOTMwMC4wO1xudmFyIFNVTl9TR1AgPSAxMzI3MTI0NDAwMTguMDtcbnZhciBNQVJTX0FQT0dFRV9WRUwgPSAyMS45NztcbnZhciBNQVJTX0FPUCA9IDQuOTk5NztcbnZhciBFQVJUSF9BUE9HRUUgPSAxNTIwOTgyMzIuMDtcbnZhciBFQVJUSF9BUE9HRUVfVkVMID0gMjkuMztcbnZhciBFQVJUSF9BT1AgPSAxLjk5MzMwO1xudmFyIHJvb3QgPSB0aGlzO1xudmFyIFBPSU5UU19USU1FID0gODY0MDAuMDtcbnZhciBVSU1vZGU7XG4oZnVuY3Rpb24gKFVJTW9kZSkge1xuICAgIFVJTW9kZVtVSU1vZGVbXCJOb3JtYWxcIl0gPSAwXSA9IFwiTm9ybWFsXCI7XG4gICAgVUlNb2RlW1VJTW9kZVtcIlBsYXliYWNrXCJdID0gMV0gPSBcIlBsYXliYWNrXCI7XG4gICAgVUlNb2RlW1VJTW9kZVtcIkFkZGluZ1BvaW50XCJdID0gMl0gPSBcIkFkZGluZ1BvaW50XCI7XG4gICAgVUlNb2RlW1VJTW9kZVtcIkluZXJ0XCJdID0gM10gPSBcIkluZXJ0XCI7XG59KShVSU1vZGUgfHwgKFVJTW9kZSA9IHt9KSk7XG47XG52YXIgRW5naW5lU2luZ2xldG9uID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVuZ2luZVNpbmdsZXRvbigpIHtcbiAgICAgICAgLy8gVUkgc3R1ZmZcbiAgICAgICAgdGhpcy51aU1vZGUgPSBVSU1vZGUuTm9ybWFsO1xuICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gLTE7XG4gICAgfVxuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc2NyZWVuVyA9IGVsLndpZHRoKCk7XG4gICAgICAgICAgICB0aGlzLnNjcmVlbkggPSBlbC5oZWlnaHQoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4ID0gZWxbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgJChlbCkub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLm1vdXNlTW92ZShlKTsgfSk7XG4gICAgICAgICAgICAkKGVsKS5vbihcInRvdWNobW92ZVwiLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMubW91c2VNb3ZlKGUpOyB9KTtcbiAgICAgICAgICAgICQod2luZG93KS5rZXlkb3duKGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5rZXlEb3duKGUpOyB9KTtcbiAgICAgICAgICAgICQod2luZG93KS5rZXl1cChmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMua2V5VXAoZSk7IH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5XID0gNjQwO1xuICAgICAgICAgICAgdGhpcy5zY3JlZW5IID0gNDgwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB2YXIgciA9IE1BUlNfQVBPR0VFICogMS4wNTtcbiAgICAgICAgdmFyIHdpZHRoID0gciAqIDIuMDtcbiAgICAgICAgdmFyIG5hcnJvd2VzdCA9IHRoaXMuc2NyZWVuVyA8IHRoaXMuc2NyZWVuSCA/IHRoaXMuc2NyZWVuVyA6IHRoaXMuc2NyZWVuSDtcbiAgICAgICAgdGhpcy5rbVBlclBpeGVsID0gMS4yICogd2lkdGggLyBuYXJyb3dlc3Q7XG4gICAgICAgIHZhciBzdW5Qb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciBzdW5WZWwgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuc3VuID0gbmV3IG9iamVjdF8xLk9CT2JqZWN0KFNVTl9TR1AsIHN1blBvcywgc3VuVmVsLCBcIiNmZmZmMDBcIiwgOCwgbnVsbCk7XG4gICAgICAgIHRoaXMubWFycyA9IG5ldyBvYmplY3RfMS5PQk9iamVjdCgwLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIG5ldyB2ZWN0b3JfMS5WZWN0b3IoKSwgXCIjZmY3ZjdmXCIsIDEsIHRoaXMuc3VuKTtcbiAgICAgICAgdGhpcy5tYXJzLmluaXRPcmJpdGVyKHRoaXMuc3VuLCBNQVJTX0FQT0dFRSwgTUFSU19BUE9HRUVfVkVMLCBNQVJTX0FPUCk7XG4gICAgICAgIHRoaXMuZWFydGggPSBuZXcgb2JqZWN0XzEuT0JPYmplY3QoMCwgbmV3IHZlY3Rvcl8xLlZlY3RvcigpLCBuZXcgdmVjdG9yXzEuVmVjdG9yKCksIFwiIzdmN2ZmZlwiLCAxLCB0aGlzLnN1bik7XG4gICAgICAgIHRoaXMuZWFydGguaW5pdE9yYml0ZXIodGhpcy5zdW4sIEVBUlRIX0FQT0dFRSwgRUFSVEhfQVBPR0VFX1ZFTCwgRUFSVEhfQU9QKTtcbiAgICAgICAgdGhpcy5tYXJzUGF0aCA9IG5ldyBwYXRoXzEuUGF0aCgpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLm1hcnMsIDUuNDQyOTU3NTUyMik7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoID0gbmV3IHBhdGhfMS5QYXRoKCk7XG4gICAgICAgIHRoaXMuZWFydGhQYXRoLmluaXROb0FjY09yYml0ZXJBbmdsZSh0aGlzLmVhcnRoLCA0Ljk3NDU4NzU1MjIpO1xuICAgICAgICB0aGlzLnNoaXAgPSBuZXcgcGF0aF8xLlBhdGgoKTtcbiAgICAgICAgdGhpcy5zaGlwLmluaXQodGhpcy5zdW4sIHRoaXMuZWFydGhQYXRoLnN0YXJ0UG9zLCB0aGlzLmVhcnRoUGF0aC5zdGFydFZlbCwgXCIjN2Y3ZjdmXCIsIDUpO1xuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5tb2RlbFRvVmlld1ggPSBmdW5jdGlvbiAobW9kZWxYKSB7XG4gICAgICAgIHZhciB4ID0gbW9kZWxYIC0gdGhpcy5jZW50ZXIuWDtcbiAgICAgICAgeCAvPSB0aGlzLmttUGVyUGl4ZWw7XG4gICAgICAgIHJldHVybiB4ICsgdGhpcy5zY3JlZW5XIC8gMjtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubW9kZWxUb1ZpZXdZID0gZnVuY3Rpb24gKG1vZGVsWSkge1xuICAgICAgICB2YXIgeSA9IG1vZGVsWSAtIHRoaXMuY2VudGVyLlk7XG4gICAgICAgIHkgLz0gdGhpcy5rbVBlclBpeGVsO1xuICAgICAgICByZXR1cm4geSArIHRoaXMuc2NyZWVuSCAvIDI7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdTZWxmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNldHVwQ2FudmFzKCk7XG4gICAgICAgIGlmICh0aGlzLnVpTW9kZSA9PSBVSU1vZGUuUGxheWJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd1BsYXliYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdOb3JtYWwoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5zZXR1cENhbnZhcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jdHguY2FudmFzLndpZHRoID0gdGhpcy5zY3JlZW5XO1xuICAgICAgICB0aGlzLmN0eC5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zY3JlZW5IO1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiMwMDBcIjtcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5zY3JlZW5XLCB0aGlzLnNjcmVlbkgpO1xuICAgICAgICB0aGlzLnN1bi5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLmVhcnRoUGF0aC5kcmF3U2VsZigpO1xuICAgICAgICB0aGlzLm1hcnNQYXRoLmRyYXdTZWxmKCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRyYXdQbGF5YmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zaGlwLmRyYXdQcm9ncmVzc2l2ZVBhdGgodGhpcy5wbGF5YmFja1N0ZXBJZHgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmVhcnRoLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMuZWFydGhQYXRoLCB0aGlzLnBsYXliYWNrU3RlcElkeCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMubWFycy5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLm1hcnNQYXRoLCB0aGlzLnBsYXliYWNrU3RlcElkeCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2hpcC5jb2xvcjtcbiAgICAgICAgdGhpcy5kcmF3UGF0aE9iamVjdCh0aGlzLnNoaXAsIHRoaXMucGxheWJhY2tTdGVwSWR4KTtcbiAgICAgICAgdmFyIG1pc3Npb25EYXkgPSB0aGlzLnBsYXliYWNrU3RlcElkeCArIDE7XG4gICAgICAgIHZhciBsYWJlbCA9IFwiTWlzc2lvbiBkYXk6IFwiICsgbWlzc2lvbkRheSArIFwiIFwiO1xuICAgICAgICBpZiAobWlzc2lvbkRheSA+PSAxMzMpIHtcbiAgICAgICAgICAgIC8vIHdvcmsgb3V0IHRoZSBzb2xcbiAgICAgICAgICAgIHZhciBzb2wgPSBtaXNzaW9uRGF5IC0gMTMyO1xuICAgICAgICAgICAgc29sICo9IDg2NDAwLjA7XG4gICAgICAgICAgICBzb2wgLz0gODg3NzUuMjQ0MDk7XG4gICAgICAgICAgICBsYWJlbCA9IGxhYmVsICsgKFwiU29sOiBcIiArIHNvbC50b0ZpeGVkKDApKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICAgICAgdGhpcy5jdHguZm9udCA9IFwiMTJweCBBcmlhbFwiO1xuICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChsYWJlbCwgMTAsIDIwKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd05vcm1hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zaGlwLmRyYXdTZWxmKHRoaXMuaG92ZXJBY2NlbFBvaW50KTtcbiAgICAgICAgaWYgKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gXCIjZmYwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLnNoaXAuZHJhd1RocnVzdExpbmUodGhpcy5ob3ZlclBhdGhQb2ludElkeCk7XG4gICAgICAgICAgICB2YXIgZGF5bnVtID0gKHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggKiA4NjQwMCkgLyBQT0lOVFNfVElNRSArIDE7XG4gICAgICAgICAgICB2YXIgZW0gPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLmVhcnRoUGF0aC5wb2ludHNbdGhpcy5ob3ZlclBhdGhQb2ludElkeF0sIHRoaXMubWFyc1BhdGgucG9pbnRzW3RoaXMuaG92ZXJQYXRoUG9pbnRJZHhdKTtcbiAgICAgICAgICAgIHZhciBlaCA9IHZlY3Rvcl8xLmdldERpc3RhbmNlKHRoaXMuZWFydGhQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSwgdGhpcy5zaGlwLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB2YXIgaG0gPSB2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLm1hcnNQYXRoLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSwgdGhpcy5zaGlwLnBvaW50c1t0aGlzLmhvdmVyUGF0aFBvaW50SWR4XSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSBcIjEycHggQXJpYWxcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFwiRGF5OiBcIiArIGRheW51bS50b0ZpeGVkKDApLCAxMCwgMjApO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJFYXJ0aC1NYXJzOiBcIiArIHRoaXMuZGlzdEluZm8oZW0pLCAxMCwgMzYpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXCJFYXJ0aC1IZXJtZXM6IFwiICsgdGhpcy5kaXN0SW5mbyhlaCksIDEwLCA1Mik7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChcIkhlcm1lcy1NYXJzOiBcIiArIHRoaXMuZGlzdEluZm8oaG0pLCAxMCwgNjgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZHggPSB0aGlzLmhvdmVyUGF0aFBvaW50SWR4O1xuICAgICAgICBpZiAoaWR4IDwgMSkge1xuICAgICAgICAgICAgaWR4ID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmVhcnRoLmNvbG9yO1xuICAgICAgICB0aGlzLmRyYXdQYXRoT2JqZWN0KHRoaXMuZWFydGhQYXRoLCBpZHgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLm1hcnMuY29sb3I7XG4gICAgICAgIHRoaXMuZHJhd1BhdGhPYmplY3QodGhpcy5tYXJzUGF0aCwgaWR4KTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUuZHJhd1BhdGhPYmplY3QgPSBmdW5jdGlvbiAodG9EcmF3LCBwb2ludElkeCkge1xuICAgICAgICB2YXIgc3RvcFBvaW50ID0gdG9EcmF3LmdldFN0b3BQb2ludCgpO1xuICAgICAgICBpZiAocG9pbnRJZHggPiBzdG9wUG9pbnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB4ID0gdGhpcy5tb2RlbFRvVmlld1godG9EcmF3LnBvaW50c1twb2ludElkeF0uWCk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5tb2RlbFRvVmlld1kodG9EcmF3LnBvaW50c1twb2ludElkeF0uWSk7XG4gICAgICAgIGV4cG9ydHMuRW5naW5lLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgZXhwb3J0cy5FbmdpbmUuY3R4LmFyYyh4LCB5LCA1LCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgIGV4cG9ydHMuRW5naW5lLmN0eC5maWxsKCk7XG4gICAgfTtcbiAgICBFbmdpbmVTaW5nbGV0b24ucHJvdG90eXBlLmRpc3RJbmZvID0gZnVuY3Rpb24gKGRpc3QpIHtcbiAgICAgICAgdmFyIGxpZ2h0U2Vjb25kcyA9IGRpc3QgLyAzMDAwMDA7XG4gICAgICAgIHZhciBsaWdodE1pbnV0ZXMgPSBsaWdodFNlY29uZHMgLyA2MDtcbiAgICAgICAgbGlnaHRTZWNvbmRzID0gbGlnaHRTZWNvbmRzICUgNjA7XG4gICAgICAgIHJldHVybiBkaXN0LnRvRml4ZWQoMCkgKyBcImttLCBcIiArIGxpZ2h0TWludXRlcy50b0ZpeGVkKDApICsgXCJtIFwiICsgbGlnaHRTZWNvbmRzLnRvRml4ZWQoMCkgKyBcInNcIjtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyByZXNwb25zZSBpcyB1bnNpZ25lZCA4IGJpdCBpbnRlZ2VyXG4gICAgICAgICAgICB2YXIgZHYgPSBuZXcgRGF0YVZpZXcodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICB2YXIgb2ZmID0gMDtcbiAgICAgICAgICAgIG9mZiA9IHRoYXQuZWFydGhQYXRoLmxvYWQoZHYsIG9mZik7XG4gICAgICAgICAgICBvZmYgPSB0aGF0Lm1hcnNQYXRoLmxvYWQoZHYsIG9mZik7XG4gICAgICAgICAgICBvZmYgPSB0aGF0LnNoaXAubG9hZChkdiwgb2ZmKTtcbiAgICAgICAgICAgIHRoYXQuZHJhd1NlbGYoKTtcbiAgICAgICAgfTtcbiAgICAgICAgeGhyLnNlbmQoKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUubW91c2VNb3ZlID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIgcmVjdCA9ICQoXCIjY2FudmFzXCIpWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgeCA9IChldnQuY2xpZW50WCB8fCBldnQudG91Y2hlc1swXS5jbGllbnRYKSAtIHJlY3QubGVmdDtcbiAgICAgICAgdmFyIHkgPSAoZXZ0LmNsaWVudFkgfHwgZXZ0LnRvdWNoZXNbMF0uY2xpZW50WSkgLSByZWN0LnRvcDtcbiAgICAgICAgLy8gaWYgKHRoaXMudWlNb2RlID09IFVJTW9kZS5BZGRpbmdQb2ludCkge1xuICAgICAgICB0aGlzLmhvdmVyUGF0aFBvaW50SWR4ID0gdGhpcy5zaGlwLmdldE5lYXJlc3RQb2ludElkeCh4LCB5KTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ob3ZlckFjY2VsUG9pbnQgPSB0aGlzLnNoaXAuZ2V0TmVhcmVzdEFjY2VsUG9pbnQoeCwgeSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgdGhpcy5kcmF3U2VsZigpO1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUucGxheWJhY2tUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgIT0gVUlNb2RlLlBsYXliYWNrKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgc3RvcElkeCA9IHRoaXMuc2hpcC5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgaWYgKHRoaXMucGxheWJhY2tTdGVwSWR4IDw9IHN0b3BJZHgpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd1NlbGYoKTtcbiAgICAgICAgICAgIHRoaXMucGxheWJhY2tTdGVwSWR4Kys7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnBsYXliYWNrVGljaygpOyB9LCAzMjAgLSAkKFwiI3NwZWVkXCIpLnZhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGxheVBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUucGxheVBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy51aU1vZGUgIT0gVUlNb2RlLlBsYXliYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXliYWNrU3RlcElkeCA9IDA7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5QbGF5YmFjaztcbiAgICAgICAgICAgIHRoaXMucGxheWJhY2tUaWNrKCk7XG4gICAgICAgICAgICAkKFwiI3BhdXNlXCIpLnNob3coKTtcbiAgICAgICAgICAgICQoXCIjcGxheVwiKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnVpTW9kZSA9IFVJTW9kZS5JbmVydDtcbiAgICAgICAgICAgICQoXCIjcGxheVwiKS5zaG93KCk7XG4gICAgICAgICAgICAkKFwiI3BhdXNlXCIpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRW5naW5lU2luZ2xldG9uLnByb3RvdHlwZS5rZXlEb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIga2V5ID0gZXZ0LmtleTtcbiAgICAgICAgaWYgKGtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJQYXRoUG9pbnRJZHggPSAtMTtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJBY2NlbFBvaW50ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudWlNb2RlID0gVUlNb2RlLkFkZGluZ1BvaW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT0gXCIgXCIpIHtcbiAgICAgICAgICAgIHRoaXMucGxheVBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEVuZ2luZVNpbmdsZXRvbi5wcm90b3R5cGUua2V5VXAgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHZhciBrZXkgPSBldnQua2V5O1xuICAgICAgICBpZiAoa2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICAgICAgdGhpcy5ob3ZlclBhdGhQb2ludElkeCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5ob3ZlckFjY2VsUG9pbnQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51aU1vZGUgPSBVSU1vZGUuTm9ybWFsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gRW5naW5lU2luZ2xldG9uO1xufSgpKTtcbjtcbmV4cG9ydHMuRW5naW5lID0gbmV3IEVuZ2luZVNpbmdsZXRvbigpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZW5naW5lLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlY3Rvcl8xID0gcmVxdWlyZShcIi4vdmVjdG9yXCIpO1xudmFyIG9yYml0XzEgPSByZXF1aXJlKFwiLi9vcmJpdFwiKTtcbnZhciBlbmdpbmVfMSA9IHJlcXVpcmUoXCIuL2VuZ2luZVwiKTtcbnZhciBPQk9iamVjdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBPQk9iamVjdChzZ3AsIHBvcywgdmVsLCBjb2xvciwgc2l6ZSwgb3JiaXRlZSkge1xuICAgICAgICB0aGlzLnNncCA9IHNncDtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMudmVsID0gdmVsO1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgICAgIHRoaXMub3JiaXRlZSA9IG9yYml0ZWU7XG4gICAgfVxuICAgIE9CT2JqZWN0LnByb3RvdHlwZS5pbml0T3JiaXRlciA9IGZ1bmN0aW9uIChvcmJpdGVlLCBhcG9nZWVEaXN0LCBhcG9nZWVWZWwsIGFvcCkge1xuICAgICAgICB0aGlzLm9yYml0ZWUgPSBvcmJpdGVlO1xuICAgICAgICB2YXIgYW5nbGVPZkFwb2dlZSA9IGFvcCAtIDMuMTQxNTk7XG4gICAgICAgIHRoaXMucG9zLnNldFJUaGV0YShhcG9nZWVEaXN0LCBhbmdsZU9mQXBvZ2VlKTtcbiAgICAgICAgdGhpcy5wb3MuYWRkVmVjdG9yKG9yYml0ZWUucG9zKTtcbiAgICAgICAgdGhpcy52ZWwuc2V0KHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy52ZWwucm90YXRlKC0zLjE0MTU5IC8gMi4wKTtcbiAgICAgICAgdGhpcy52ZWwuc2V0TGVuZ3RoKGFwb2dlZVZlbCk7XG4gICAgICAgIHRoaXMub3JiaXQgPSBuZXcgb3JiaXRfMS5PcmJpdCgwLCAwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5vcmJpdC5pbml0UFYob3JiaXRlZS5zZ3AsIHRoaXMucG9zLCB0aGlzLnZlbCk7XG4gICAgICAgIHRoaXMub3JiaXQuY29sb3IgPSB0aGlzLmNvbG9yO1xuICAgIH07XG4gICAgT0JPYmplY3QucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbiAoc2Vjb25kcykge1xuICAgICAgICBpZiAoIXRoaXMub3JiaXRlZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhY2MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yO1xuICAgICAgICBhY2Muc2V0KHRoaXMub3JiaXRlZS5wb3MpO1xuICAgICAgICBhY2Muc3VidHJhY3RWZWN0b3IodGhpcy5wb3MpO1xuICAgICAgICB2YXIgYWNjTGVuID0gKHNlY29uZHMgKiB0aGlzLm9yYml0ZWUuc2dwKSAvIGFjYy5nZXRMZW5ndGhTcSgpO1xuICAgICAgICBhY2Muc2V0TGVuZ3RoKGFjY0xlbik7XG4gICAgICAgIHRoaXMudmVsLmFkZFZlY3RvcihhY2MpO1xuICAgICAgICB2YXIgdG9BZGQgPSBuZXcgdmVjdG9yXzEuVmVjdG9yO1xuICAgICAgICB0b0FkZC5zZXQodGhpcy52ZWwpO1xuICAgICAgICB0b0FkZC5zY2FsYXJNdWx0aXBseShzZWNvbmRzKTtcbiAgICAgICAgdGhpcy5wb3MuYWRkVmVjdG9yKHRvQWRkKTtcbiAgICB9O1xuICAgIE9CT2JqZWN0LnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3JiaXQpIHtcbiAgICAgICAgICAgIHRoaXMub3JiaXQuZHJhd1NlbGYoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1godGhpcy5wb3MuWCk7XG4gICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvcy5ZKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmFyYyh4LCB5LCB0aGlzLnNpemUsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5maWxsKCk7XG4gICAgfTtcbiAgICBPQk9iamVjdC5wcm90b3R5cGUucmVjYWxjT3JiaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub3JiaXQuaW5pdFBWKHRoaXMub3JiaXQudSwgdGhpcy5wb3MsIHRoaXMudmVsKTtcbiAgICB9O1xuICAgIHJldHVybiBPQk9iamVjdDtcbn0oKSk7XG5leHBvcnRzLk9CT2JqZWN0ID0gT0JPYmplY3Q7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1vYmplY3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdmVjdG9yXzEgPSByZXF1aXJlKFwiLi92ZWN0b3JcIik7XG52YXIgZW5naW5lXzEgPSByZXF1aXJlKFwiLi9lbmdpbmVcIik7XG52YXIgT3JiaXQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT3JiaXQoc2dwLCBlLCBhLCB3KSB7XG4gICAgICAgIHRoaXMuaW5pdChzZ3AsIGUsIGEsIHcpO1xuICAgIH1cbiAgICBPcmJpdC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChzZ3AsIGUsIGEsIHcpIHtcbiAgICAgICAgdGhpcy51ID0gc2dwO1xuICAgICAgICB0aGlzLmUgPSBlO1xuICAgICAgICB0aGlzLmEgPSBhO1xuICAgICAgICB0aGlzLncgPSB3O1xuICAgICAgICB0aGlzLnZhbGlkID0gZSA8IDEuMCAmJiBhID4gMC4wO1xuICAgICAgICB0aGlzLmYxID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICB0aGlzLmYgPSB0aGlzLmUgKiB0aGlzLmE7XG4gICAgICAgIHRoaXMuYiA9IE1hdGguc3FydCh0aGlzLmEgKiB0aGlzLmEgLSB0aGlzLmYgKiB0aGlzLmYpO1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5jZW50ZXIuc2V0UlRoZXRhKHRoaXMuZiwgdGhpcy53KTtcbiAgICAgICAgdGhpcy5mMiA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy5mMi5zZXRSVGhldGEoMiAqIHRoaXMuZiwgdGhpcy53KTtcbiAgICAgICAgdGhpcy5lbmVyZ3kgPSAtdGhpcy51IC8gKDIuMCAqIHRoaXMuYSk7XG4gICAgICAgIHRoaXMuYXBvZ2VlID0gdGhpcy5hICsgdGhpcy5mO1xuICAgICAgICB0aGlzLnBlcmlnZWUgPSB0aGlzLmEgLSB0aGlzLmY7XG4gICAgICAgIHRoaXMub3JiaXRBcmVhID0gTWF0aC5QSSAqIHRoaXMuYSAqIHRoaXMuYjtcbiAgICAgICAgdGhpcy5jYWxjRHJhd1BvaW50cygpO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmluaXRQViA9IGZ1bmN0aW9uIChzZ3AsIG9yYml0ZXJQb3MsIG9yYml0ZXJWZWwpIHtcbiAgICAgICAgdGhpcy5mMSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdGhpcy51ID0gc2dwO1xuICAgICAgICB0aGlzLnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHJlbGF0aXZlUG9zID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICByZWxhdGl2ZVBvcy5zZXQob3JiaXRlclBvcyk7XG4gICAgICAgIHJlbGF0aXZlUG9zLnNjYWxhck11bHRpcGx5KC0xKTtcbiAgICAgICAgdmFyIHIgPSByZWxhdGl2ZVBvcy5nZXRMZW5ndGgoKTtcbiAgICAgICAgaWYgKHIgPD0gMC4wKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHYgPSBvcmJpdGVyVmVsLmdldExlbmd0aCgpO1xuICAgICAgICB0aGlzLmVuZXJneSA9ICh2ICogdiAvIDIuMCkgLSAodGhpcy51IC8gcik7XG4gICAgICAgIGlmICh0aGlzLmVuZXJneSA+PSAwLjApIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmEgPSAtdGhpcy51IC8gKDIuMCAqIHRoaXMuZW5lcmd5KTtcbiAgICAgICAgdmFyIGQgPSAyLjAgKiB0aGlzLmEgLSByO1xuICAgICAgICB2YXIgb3JiaXRlckFuZ2xlID0gcmVsYXRpdmVQb3MuZ2V0QW5nbGUoKTtcbiAgICAgICAgdmFyIHZlbEFuZ2xlID0gb3JiaXRlclZlbC5nZXRBbmdsZSgpO1xuICAgICAgICB2YXIgdGhldGEgPSB2ZWN0b3JfMS5hbmdsZURpZmYodmVsQW5nbGUsIG9yYml0ZXJBbmdsZSk7XG4gICAgICAgIHZhciBwaGkgPSBNYXRoLlBJIC0gdGhldGE7XG4gICAgICAgIHRoaXMuZjIuc2V0KG9yYml0ZXJWZWwpO1xuICAgICAgICB0aGlzLmYyLnNldExlbmd0aChkKTtcbiAgICAgICAgdGhpcy5mMi5yb3RhdGUocGhpKTtcbiAgICAgICAgdGhpcy5mMi5hZGRWZWN0b3Iob3JiaXRlclBvcyk7XG4gICAgICAgIHRoaXMudyA9IHRoaXMuZjIuZ2V0QW5nbGUoKTtcbiAgICAgICAgdGhpcy5mID0gdGhpcy5mMi5nZXRMZW5ndGgoKSAvIDI7XG4gICAgICAgIHRoaXMuZSA9IHRoaXMuZiAvIHRoaXMuYTtcbiAgICAgICAgdGhpcy5pbml0KHNncCwgdGhpcy5lLCB0aGlzLmEsIHRoaXMudyk7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuY2FsY0RyYXdQb2ludHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy52YWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4U3RlcCA9IDIuMCAqIGVuZ2luZV8xLkVuZ2luZS5rbVBlclBpeGVsO1xuICAgICAgICB2YXIgbnVtUG9pbnRzID0gTWF0aC5yb3VuZCgoMi4wICogdGhpcy5hKSAvIHhTdGVwKSArIDI7IC8vIHRoZSArMiBpcyBmb3Igcm91bmRpbmcgc2FmZXR5XG4gICAgICAgIHZhciBtYXhEcmF3UG9pbnRzID0gbnVtUG9pbnRzICogMjtcbiAgICAgICAgdGhpcy5kcmF3UG9pbnRzID0gW107XG4gICAgICAgIHZhciBmaXJzdEhhbGYgPSBbXTtcbiAgICAgICAgdmFyIHNlY29uZEhhbGYgPSBbXTtcbiAgICAgICAgdmFyIGhhbGZQb3MgPSAwO1xuICAgICAgICB2YXIgeCA9IC10aGlzLmE7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgYWxwaGEgPSAxLjAgLSAoeCAqIHgpIC8gKHRoaXMuYSAqIHRoaXMuYSk7XG4gICAgICAgICAgICB2YXIgeSA9IE1hdGguc3FydCh0aGlzLmIgKiB0aGlzLmIgKiBhbHBoYSk7XG4gICAgICAgICAgICBpZiAoaGFsZlBvcyA+PSBudW1Qb2ludHMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIk9vcHNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JrID0gbmV3IHZlY3Rvcl8xLlZlY3Rvcih4LCB5KTtcbiAgICAgICAgICAgIHdvcmsucm90YXRlKHRoaXMudyk7XG4gICAgICAgICAgICB3b3JrLmFkZFZlY3Rvcih0aGlzLmNlbnRlcik7XG4gICAgICAgICAgICBmaXJzdEhhbGZbaGFsZlBvc10gPSB7XG4gICAgICAgICAgICAgICAgWDogZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh3b3JrLlgpLFxuICAgICAgICAgICAgICAgIFk6IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kod29yay5ZKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdvcmsgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKHgsIC15KTtcbiAgICAgICAgICAgIHdvcmsucm90YXRlKHRoaXMudyk7XG4gICAgICAgICAgICB3b3JrLmFkZFZlY3Rvcih0aGlzLmNlbnRlcik7XG4gICAgICAgICAgICBzZWNvbmRIYWxmW2hhbGZQb3NdID0ge1xuICAgICAgICAgICAgICAgIFg6IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1god29yay5YKSxcbiAgICAgICAgICAgICAgICBZOiBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHdvcmsuWSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYWxmUG9zKys7XG4gICAgICAgICAgICBpZiAoeCA9PSB0aGlzLmEpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHggKz0geFN0ZXA7XG4gICAgICAgICAgICBpZiAoeCA+IHRoaXMuYSkge1xuICAgICAgICAgICAgICAgIHggPSB0aGlzLmE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3UG9pbnRzID0gZmlyc3RIYWxmO1xuICAgICAgICB0aGlzLmRyYXdQb2ludHMucHVzaC5hcHBseShzZWNvbmRIYWxmLnJldmVyc2UoKSk7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuZHJhd1NlbGYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy52YWxpZCB8fCAhdGhpcy5kcmF3UG9pbnRzIHx8IHRoaXMuZHJhd1BvaW50cy5sZW5ndGggPCAyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgX2EgPSB0aGlzLmRyYXdQb2ludHNbMF0sIGxhc3RYID0gX2EuWCwgbGFzdFkgPSBfYS5ZO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9iID0gdGhpcy5kcmF3UG9pbnRzOyBfaSA8IF9iLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHAgPSBfYltfaV07XG4gICAgICAgICAgICB2YXIgdGhpc1ggPSBwLlgsIHRoaXNZID0gcC5ZO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMaW5lIChcIiArIGxhc3RYICsgXCIsIFwiICsgbGFzdFkgKyBcIiktKFwiICsgdGhpc1ggKyBcIiwgXCIgKyB0aGlzWSArIFwiKVwiKTtcbiAgICAgICAgICAgIF9jID0gW3RoaXNYLCB0aGlzWV0sIGxhc3RYID0gX2NbMF0sIGxhc3RZID0gX2NbMV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF9jO1xuICAgIH07XG4gICAgT3JiaXQucHJvdG90eXBlLmdldFIgPSBmdW5jdGlvbiAodGhldGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbnVtZXJhdG9yID0gdGhpcy5hICogKDEuMCAtIHRoaXMuZSAqIHRoaXMuZSk7XG4gICAgICAgIHZhciBkZW5vbWluYXRvciA9IDEuMCAtIHRoaXMuZSAqIChNYXRoLmNvcyh0aGV0YSAtIHRoaXMudykpO1xuICAgICAgICByZXR1cm4gbnVtZXJhdG9yIC8gZGVub21pbmF0b3I7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuZ2V0UG9zID0gZnVuY3Rpb24gKHRoZXRhKSB7XG4gICAgICAgIHZhciBwb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHZhciByID0gdGhpcy5nZXRSKHRoZXRhKTtcbiAgICAgICAgcG9zLnNldFJUaGV0YShyLCB0aGV0YSk7XG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgfTtcbiAgICBPcmJpdC5wcm90b3R5cGUuZ2V0VmVsID0gZnVuY3Rpb24gKHRoZXRhKSB7XG4gICAgICAgIHZhciBwb3MgPSB0aGlzLmdldFBvcyh0aGV0YSk7XG4gICAgICAgIHZhciByID0gcG9zLmdldExlbmd0aCgpO1xuICAgICAgICB2YXIgdlNxdWFyZWQgPSAyLjAgKiAodGhpcy5lbmVyZ3kgKyB0aGlzLnUgLyByKTtcbiAgICAgICAgdmFyIHYgPSBNYXRoLnNxcnQodlNxdWFyZWQpO1xuICAgICAgICB2YXIgYW5nbGVUb0YxID0gTWF0aC5QSSArIHRoZXRhO1xuICAgICAgICB2YXIgbG9va0F0RjIgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIGxvb2tBdEYyLnNldCh0aGlzLmYyKTtcbiAgICAgICAgbG9va0F0RjIuc3VidHJhY3RWZWN0b3IocG9zKTtcbiAgICAgICAgdmFyIGFuZ2xlVG9GMiA9IGxvb2tBdEYyLmdldEFuZ2xlKCk7XG4gICAgICAgIHZhciBkaWZmID0gdmVjdG9yXzEuYW5nbGVEaWZmKGFuZ2xlVG9GMSwgYW5nbGVUb0YyKTtcbiAgICAgICAgdmFyIGFuZ2xlID0gYW5nbGVUb0YxICsgZGlmZiAvIDIuMDtcbiAgICAgICAgdmFyIHZlbEFuZ2xlID0gYW5nbGUgKyAoTWF0aC5QSSAvIDIuMCk7XG4gICAgICAgIHZhciBvdXQgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIG91dC5zZXRSVGhldGEodiwgdmVsQW5nbGUpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgcmV0dXJuIE9yYml0O1xufSgpKTtcbmV4cG9ydHMuT3JiaXQgPSBPcmJpdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9yYml0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZlY3Rvcl8xID0gcmVxdWlyZShcIi4vdmVjdG9yXCIpO1xudmFyIGVuZ2luZV8xID0gcmVxdWlyZShcIi4vZW5naW5lXCIpO1xudmFyIEFjY1R5cGU7XG4oZnVuY3Rpb24gKEFjY1R5cGUpIHtcbiAgICBBY2NUeXBlW0FjY1R5cGVbXCJOb3JtYWxcIl0gPSAwXSA9IFwiTm9ybWFsXCI7XG4gICAgQWNjVHlwZVtBY2NUeXBlW1wiUmVkaXJlY3RcIl0gPSAxXSA9IFwiUmVkaXJlY3RcIjtcbiAgICBBY2NUeXBlW0FjY1R5cGVbXCJTdG9wVHJhY2VcIl0gPSAyXSA9IFwiU3RvcFRyYWNlXCI7XG59KShBY2NUeXBlIHx8IChBY2NUeXBlID0ge30pKTtcbjtcbjtcbnZhciBQQVRIX0FDQ0VMRVJBVElPTiA9IDAuMDAwMDAyO1xudmFyIFBPSU5UU19USU1FID0gODY0MDAuMDtcbnZhciBGQVRBTF9TVU5fQVBQUk9BQ0ggPSAzNTAwMDAwMC4wO1xudmFyIERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggPSA1MDtcbnZhciBQYXRoID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBhdGgoKSB7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzID0gW107XG4gICAgICAgIHRoaXMucG9pbnRzID0gW107XG4gICAgfVxuICAgIFBhdGgucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAob3JiaXRlZSwgcG9zLCB2ZWwsIGNvbG9yLCBzaXplKSB7XG4gICAgICAgIHRoaXMuaW5pdE5vQWNjKG9yYml0ZWUsIHBvcywgdmVsLCBjb2xvciwgc2l6ZSk7XG4gICAgICAgIHZhciBuZXdQb2ludCA9IHRoaXMuY3JlYXRlQWNjZWxlcmF0aW9uUG9pbnQoMCk7XG4gICAgICAgIG5ld1BvaW50LmFuZ2xlID0gTWF0aC5QSSAvIDIuMDtcbiAgICAgICAgbmV3UG9pbnQubWFnID0gUEFUSF9BQ0NFTEVSQVRJT047XG4gICAgICAgIHRoaXMuY2FsY1BvaW50cygpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuaW5pdE5vQWNjID0gZnVuY3Rpb24gKG9yYml0ZWUsIHBvcywgdmVsLCBjb2xvciwgc2l6ZSkge1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgICAgIHRoaXMub3JiaXRlZSA9IG9yYml0ZWU7XG4gICAgICAgIHRoaXMuc3RhcnRQb3MgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuc3RhcnRQb3Muc2V0KHBvcyk7XG4gICAgICAgIHRoaXMuc3RhcnRWZWwgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIHRoaXMuc3RhcnRWZWwuc2V0KHZlbCk7XG4gICAgICAgIHRoaXMuY2FsY1BvaW50cygpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuaW5pdE5vQWNjT3JiaXRlckFuZ2xlID0gZnVuY3Rpb24gKG9yYml0ZXIsIGFuZ2xlKSB7XG4gICAgICAgIGFuZ2xlID0gLU1hdGguUEkgLyAyLjAgLSBhbmdsZTtcbiAgICAgICAgdmFyIG9yYml0ZWUgPSBvcmJpdGVyLm9yYml0ZWU7XG4gICAgICAgIHZhciBwb3MgPSBvcmJpdGVyLm9yYml0LmdldFBvcyhhbmdsZSk7XG4gICAgICAgIHZhciB2ZWwgPSBvcmJpdGVyLm9yYml0LmdldFZlbChhbmdsZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmluaXROb0FjYyhvcmJpdGVlLCBwb3MsIHZlbCwgb3JiaXRlci5vcmJpdC5jb2xvciwgb3JiaXRlci5zaXplKTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLnJlbW92ZUFjY2VsZXJhdGlvblBvaW50ID0gZnVuY3Rpb24gKGFwKSB7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMuZmlsdGVyKGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAhPT0gYXA7IH0pO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuYWRqdXN0QWNjZWxlcmF0aW9uUG9pbnQgPSBmdW5jdGlvbiAoYXAsIG14LCBteSwgbmV3TWFnKSB7XG4gICAgICAgIHZhciBwb2ludElkeCA9IGFwLnBvaW50SWR4O1xuICAgICAgICB2YXIgYXBYID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1twb2ludElkeF0uWCk7XG4gICAgICAgIHZhciBhcFkgPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW3BvaW50SWR4XS5ZKTtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKG14IC0gYXBYLCBteSAtIGFwWSk7XG4gICAgICAgIHZhciB1bmFkanVzdGVkQW5nID0gbmV3TGluZS5nZXRBbmdsZSgpO1xuICAgICAgICB2YXIgZ3JhdiA9IHRoaXMuZ2V0R3JhdkZvclBvaW50KHBvaW50SWR4KTtcbiAgICAgICAgdmFyIGdyYXZBbmcgPSBncmF2LmdldEFuZ2xlKCk7XG4gICAgICAgIGFwLmFuZ2xlID0gdmVjdG9yXzEuYW5nbGVEaWZmKGdyYXZBbmcsIHVuYWRqdXN0ZWRBbmcpO1xuICAgICAgICBhcC5tYWcgPSBuZXdNYWc7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5nZXRHcmF2Rm9yUG9pbnQgPSBmdW5jdGlvbiAocG9pbnRJZHgpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgcmVzdWx0LnNldCh0aGlzLm9yYml0ZWUucG9zKTtcbiAgICAgICAgaWYgKHBvaW50SWR4ID09IDApIHtcbiAgICAgICAgICAgIHJlc3VsdC5zdWJ0cmFjdFZlY3Rvcih0aGlzLnN0YXJ0UG9zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5zdWJ0cmFjdFZlY3Rvcih0aGlzLnBvaW50c1twb2ludElkeCAtIDFdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuY3JlYXRlQWNjZWxlcmF0aW9uUG9pbnQgPSBmdW5jdGlvbiAocG9pbnRJZHgpIHtcbiAgICAgICAgdmFyIGFwID0geyBwb2ludElkeDogcG9pbnRJZHggfTtcbiAgICAgICAgaWYgKHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciB0aHJ1c3QgPSB0aGlzLmdldFRocnVzdEZvclBvaW50KHBvaW50SWR4KTtcbiAgICAgICAgICAgIGFwLm1hZyA9IHRocnVzdC5nZXRMZW5ndGgoKTtcbiAgICAgICAgICAgIHZhciBncmF2ID0gdGhpcy5nZXRHcmF2Rm9yUG9pbnQocG9pbnRJZHgpO1xuICAgICAgICAgICAgYXAuYW5nbGUgPSB2ZWN0b3JfMS5hbmdsZURpZmYoZ3Jhdi5nZXRBbmdsZSgpLCB0aHJ1c3QuZ2V0QW5nbGUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgYXAudHlwZSA9IEFjY1R5cGUuTm9ybWFsO1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5wdXNoKGFwKTtcbiAgICAgICAgcmV0dXJuIGFwO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0VGhydXN0Rm9yUG9pbnQgPSBmdW5jdGlvbiAocG9pbnRJZHgpIHtcbiAgICAgICAgaWYgKHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdyYXYgPSB0aGlzLmdldEdyYXZGb3JQb2ludChwb2ludElkeCk7XG4gICAgICAgIHZhciBhcDtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIHRoaXNBcCA9IF9hW19pXTtcbiAgICAgICAgICAgIGlmICh0aGlzQXAucG9pbnRJZHggPiBwb2ludElkeCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXAgPSB0aGlzQXA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhcCkge1xuICAgICAgICAgICAgYXAgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50c1t0aGlzLmFjY2VsZXJhdGlvblBvaW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWNjID0gbmV3IHZlY3Rvcl8xLlZlY3RvcigpO1xuICAgICAgICBhY2Muc2V0KGdyYXYpO1xuICAgICAgICBhY2Mucm90YXRlKGFwLmFuZ2xlKTtcbiAgICAgICAgYWNjLnNldExlbmd0aChhcC5tYWcpO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuY2FsY1BvaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBvcyA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgcG9zLnNldCh0aGlzLnN0YXJ0UG9zKTtcbiAgICAgICAgdmFyIHZlbCA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgdmVsLnNldCh0aGlzLnN0YXJ0VmVsKTtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICBpZiAoIXRoaXMucG9pbnRzWzBdKSB7XG4gICAgICAgICAgICB0aGlzLnBvaW50c1swXSA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBvaW50c1swXS5zZXQocG9zKTtcbiAgICAgICAgdmFyIGhhbHQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gc3RvcElkeDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucG9pbnRzW2ldKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludHNbaV0gPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaGFsdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG9pbnRzW2ldLnNldCh0aGlzLnBvaW50c1tpIC0gMV0pO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGdyYXYgPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgICAgICBncmF2LnNldCh0aGlzLm9yYml0ZWUucG9zKTtcbiAgICAgICAgICAgIGdyYXYuc3VidHJhY3RWZWN0b3IocG9zKTtcbiAgICAgICAgICAgIHZhciBncmF2QWNjTGVuID0gKFBPSU5UU19USU1FICogdGhpcy5vcmJpdGVlLnNncCkgLyBncmF2LmdldExlbmd0aFNxKCk7XG4gICAgICAgICAgICBncmF2LnNldExlbmd0aChncmF2QWNjTGVuKTtcbiAgICAgICAgICAgIHZlbC5hZGRWZWN0b3IoZ3Jhdik7XG4gICAgICAgICAgICB2YXIgdGhydXN0QWNjID0gdGhpcy5nZXRUaHJ1c3RGb3JQb2ludChpKTtcbiAgICAgICAgICAgIHRocnVzdEFjYy5zY2FsYXJNdWx0aXBseShQT0lOVFNfVElNRSk7XG4gICAgICAgICAgICB2ZWwuYWRkVmVjdG9yKHRocnVzdEFjYyk7XG4gICAgICAgICAgICB2YXIgYXA7XG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgYXAgPSBfYVtfaV07XG4gICAgICAgICAgICAgICAgaWYgKGFwLnBvaW50SWR4ICE9IGkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmIChhcC50eXBlID09IEFjY1R5cGUuUmVkaXJlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdmVsLnNldFJUaGV0YSh2ZWwuZ2V0TGVuZ3RoKCksIHRocnVzdEFjYy5nZXRBbmdsZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd29yayA9IG5ldyB2ZWN0b3JfMS5WZWN0b3IoKTtcbiAgICAgICAgICAgIHdvcmsuc2V0KHZlbCk7XG4gICAgICAgICAgICB3b3JrLnNjYWxhck11bHRpcGx5KFBPSU5UU19USU1FKTtcbiAgICAgICAgICAgIHBvcy5hZGRWZWN0b3Iod29yayk7XG4gICAgICAgICAgICBpZiAoIXRoaXMucG9pbnRzW2ldKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2ludHNbaV0gPSBuZXcgdmVjdG9yXzEuVmVjdG9yKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBvaW50c1tpXS5zZXQocG9zKTtcbiAgICAgICAgICAgIGlmICh2ZWN0b3JfMS5nZXREaXN0YW5jZSh0aGlzLnBvaW50c1tpXSwgdGhpcy5vcmJpdGVlLnBvcykgPCBGQVRBTF9TVU5fQVBQUk9BQ0gpIHtcbiAgICAgICAgICAgICAgICBoYWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZHJhd1Byb2dyZXNzaXZlUGF0aCA9IGZ1bmN0aW9uIChwb2ludElkeCkge1xuICAgICAgICB2YXIgc3RvcElkeCA9IHRoaXMuZ2V0U3RvcFBvaW50KCk7XG4gICAgICAgIGlmIChzdG9wSWR4ID4gcG9pbnRJZHgpIHtcbiAgICAgICAgICAgIHN0b3BJZHggPSBwb2ludElkeDtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZyhcIkRyYXcgcHJvZyBwYXRoIHVudGlsIFwiICsgc3RvcElkeCk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdG9wSWR4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1tpXS5YKTtcbiAgICAgICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1tpXS5ZKTtcbiAgICAgICAgICAgIHZhciBkcmF3ID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoaSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRocnVzdCA9IHRoaXMuZ2V0VGhydXN0Rm9yUG9pbnQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKHRocnVzdC5nZXRMZW5ndGgoKSAhPSAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhdyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpID4gMTcwKVxuICAgICAgICAgICAgICAgICAgICBkcmF3ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkcmF3KSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTW92ZSB0byBcIiArIHggKyBcIixcIiArIHkpO1xuICAgICAgICB9XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguc3Ryb2tlKCk7XG4gICAgfTtcbiAgICBQYXRoLnByb3RvdHlwZS5kcmF3U2VsZiA9IGZ1bmN0aW9uIChzZWwpIHtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgbGFzdFg7XG4gICAgICAgIHZhciBsYXN0WTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XG4gICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiB0aGlzLnBvaW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB4ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WCh0aGlzLnBvaW50c1tpXS5YKTtcbiAgICAgICAgICAgIHZhciB5ID0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1tpXS5ZKTtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdmFyIGFwO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gdGhpcy5hY2NlbGVyYXRpb25Qb2ludHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcCA9IF9hW19pXTtcbiAgICAgICAgICAgIHZhciBpID0gYXAucG9pbnRJZHg7XG4gICAgICAgICAgICB2YXIgeCA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1godGhpcy5wb2ludHNbaV0uWCk7XG4gICAgICAgICAgICB2YXIgeSA9IGVuZ2luZV8xLkVuZ2luZS5tb2RlbFRvVmlld1kodGhpcy5wb2ludHNbaV0uWSk7XG4gICAgICAgICAgICBpZiAoYXAgPT0gc2VsKSB7XG4gICAgICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmMDBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFwLnR5cGUgPT0gQWNjVHlwZS5SZWRpcmVjdCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguZmlsbFN0eWxlID0gXCIjMDAwMGZmXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmZpbGxTdHlsZSA9IFwiI2ZmMDAwMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIGVuZ2luZV8xLkVuZ2luZS5jdHguYXJjKHgsIHksIHRoaXMuc2l6ZSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmRyYXdUaHJ1c3RMaW5lKGkpO1xuICAgICAgICAgICAgaWYgKGFwLnR5cGUgPT0gQWNjVHlwZS5TdG9wVHJhY2UpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmRyYXdUaHJ1c3RMaW5lID0gZnVuY3Rpb24gKHBvaW50SURYKSB7XG4gICAgICAgIGlmIChwb2ludElEWCA9PSAtMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIHZlYyA9IHRoaXMuZ2V0VGhydXN0Rm9yUG9pbnQocG9pbnRJRFgpO1xuICAgICAgICBpZiAodmVjLmdldExlbmd0aCgpID09IDAuMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmVjLnNldExlbmd0aChESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIKTtcbiAgICAgICAgdmFyIHggPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW3BvaW50SURYXS5YKTtcbiAgICAgICAgdmFyIHkgPSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW3BvaW50SURYXS5ZKTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5zdHJva2VTdHlsZSA9IFwiI2ZmZlwiO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgZW5naW5lXzEuRW5naW5lLmN0eC5saW5lVG8oeCArIHZlYy5YLCB5ICsgdmVjLlkpO1xuICAgICAgICBlbmdpbmVfMS5FbmdpbmUuY3R4LnN0cm9rZSgpO1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0U3RvcFBvaW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGlnaGVzdElkeCA9IDA7XG4gICAgICAgIHZhciBhcDtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IHRoaXMuYWNjZWxlcmF0aW9uUG9pbnRzOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgYXAgPSBfYVtfaV07XG4gICAgICAgICAgICBpZiAoYXAudHlwZSA9PSBBY2NUeXBlLlN0b3BUcmFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcC5wb2ludElkeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gOTAwIC0gMTtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmdldE5lYXJlc3RQb2ludElkeCA9IGZ1bmN0aW9uICh2aWV3WCwgdmlld1kpIHtcbiAgICAgICAgdmFyIE1BWF9ESVNUID0gRElTUExBWV9USFJVU1RMSU5FX0xFTkdUSCArIERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggLyAxMDtcbiAgICAgICAgdmFyIE1BWF9ESVNUX1NRID0gTUFYX0RJU1QgKiBNQVhfRElTVDtcbiAgICAgICAgdmFyIHN0b3BJZHggPSB0aGlzLmdldFN0b3BQb2ludCgpO1xuICAgICAgICB2YXIgY2xvc2VzdElkeCA9IC0xO1xuICAgICAgICB2YXIgY2xvc2VzdERpc3RTcSA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0b3BJZHg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2ldLlgpO1xuICAgICAgICAgICAgdmFyIGR5ID0gdmlld1kgLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdZKHRoaXMucG9pbnRzW2ldLlkpO1xuICAgICAgICAgICAgdmFyIGRpc3RTcSA9IGR4ICogZHggKyBkeSAqIGR5O1xuICAgICAgICAgICAgaWYgKGRpc3RTcSA8IE1BWF9ESVNUX1NRKSB7XG4gICAgICAgICAgICAgICAgaWYgKChjbG9zZXN0SWR4ID09IC0xKSB8fCAoZGlzdFNxIDwgY2xvc2VzdERpc3RTcSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3RTcSA9IGRpc3RTcTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdElkeCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXN0SWR4O1xuICAgIH07XG4gICAgUGF0aC5wcm90b3R5cGUuZ2V0TmVhcmVzdEFjY2VsUG9pbnQgPSBmdW5jdGlvbiAodmlld1gsIHZpZXdZKSB7XG4gICAgICAgIHZhciBNQVhfRElTVCA9IERJU1BMQVlfVEhSVVNUTElORV9MRU5HVEggKyBESVNQTEFZX1RIUlVTVExJTkVfTEVOR1RIIC8gMTA7XG4gICAgICAgIHZhciBNQVhfRElTVF9TUSA9IE1BWF9ESVNUICogTUFYX0RJU1Q7XG4gICAgICAgIHZhciBzdG9wSWR4ID0gdGhpcy5nZXRTdG9wUG9pbnQoKTtcbiAgICAgICAgdmFyIGNsb3Nlc3RBcDtcbiAgICAgICAgdmFyIGNsb3Nlc3REaXN0U3EgPSAwO1xuICAgICAgICB2YXIgYXA7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB0aGlzLmFjY2VsZXJhdGlvblBvaW50czsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGFwID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIGR4ID0gdmlld1ggLSBlbmdpbmVfMS5FbmdpbmUubW9kZWxUb1ZpZXdYKHRoaXMucG9pbnRzW2FwLnBvaW50SWR4XS5YKTtcbiAgICAgICAgICAgIHZhciBkeSA9IHZpZXdZIC0gZW5naW5lXzEuRW5naW5lLm1vZGVsVG9WaWV3WSh0aGlzLnBvaW50c1thcC5wb2ludElkeF0uWSk7XG4gICAgICAgICAgICB2YXIgZGlzdFNxID0gZHggKiBkeCArIGR5ICogZHk7XG4gICAgICAgICAgICBpZiAoZGlzdFNxIDwgTUFYX0RJU1RfU1EpIHtcbiAgICAgICAgICAgICAgICBpZiAoKCFjbG9zZXN0QXApIHx8IChkaXN0U3EgPCBjbG9zZXN0RGlzdFNxKSkge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0RGlzdFNxID0gZGlzdFNxO1xuICAgICAgICAgICAgICAgICAgICBjbG9zZXN0QXAgPSBhcDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3Nlc3RBcDtcbiAgICB9O1xuICAgIFBhdGgucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAoZHYsIG9mZikge1xuICAgICAgICB0aGlzLnN0YXJ0UG9zLlggPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0UG9zLlkgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0VmVsLlggPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLnN0YXJ0VmVsLlkgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgIG9mZiArPSA4O1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvblBvaW50cyA9IFtdO1xuICAgICAgICB2YXIgbnVtUG9pbnRzID0gZHYuZ2V0SW50MzIob2ZmKTtcbiAgICAgICAgb2ZmICs9IDQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUG9pbnRzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhcCA9IHt9O1xuICAgICAgICAgICAgYXAucG9pbnRJZHggPSBkdi5nZXRJbnQzMihvZmYpO1xuICAgICAgICAgICAgb2ZmICs9IDQ7XG4gICAgICAgICAgICBhcC50eXBlID0gZHYuZ2V0SW50MzIob2ZmKTtcbiAgICAgICAgICAgIG9mZiArPSA0O1xuICAgICAgICAgICAgYXAuYW5nbGUgPSBkdi5nZXRGbG9hdDY0KG9mZiwgdHJ1ZSk7XG4gICAgICAgICAgICBvZmYgKz0gODtcbiAgICAgICAgICAgIGFwLm1hZyA9IGR2LmdldEZsb2F0NjQob2ZmLCB0cnVlKTtcbiAgICAgICAgICAgIG9mZiArPSA4O1xuICAgICAgICAgICAgdGhpcy5hY2NlbGVyYXRpb25Qb2ludHMucHVzaChhcCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgICAgIHJldHVybiBvZmY7XG4gICAgfTtcbiAgICByZXR1cm4gUGF0aDtcbn0oKSk7XG5leHBvcnRzLlBhdGggPSBQYXRoO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGF0aC5qcy5tYXAiLCJFbmdpbmUgPSByZXF1aXJlKFwiLi9lbmdpbmVcIikuRW5naW5lO1xuJChmdW5jdGlvbigpIHtcbiAgRW5naW5lLmluaXQoJChcIiNjYW52YXNcIikpO1xuICBjb25zb2xlLmxvZyhFbmdpbmUpO1xuICBFbmdpbmUuZHJhd1NlbGYoKTtcbiAgJChcIiNvcmlnaW5hbFwiKS5jbGljayhmdW5jdGlvbigpIHsgRW5naW5lLmxvYWQoXCJvcmlnaW5hbC5zYXZcIik7IH0pXG4gICQoXCIjc29sNmFib3J0XCIpLmNsaWNrKGZ1bmN0aW9uKCkgeyBFbmdpbmUubG9hZChcInNvbDZhYm9ydC5zYXZcIik7IH0pXG4gICQoXCIjZmluYWxcIikuY2xpY2soZnVuY3Rpb24oKSB7IEVuZ2luZS5sb2FkKFwiZmluYWwuc2F2XCIpOyB9KVxuICAkKFwiI3BhdXNlXCIpLmhpZGUoKTtcbiAgJChcIiNwbGF5LCNwYXVzZVwiKS5jbGljayhmdW5jdGlvbigpIHsgRW5naW5lLnBsYXlQYXVzZSgpOyB9KVxuXG59KTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgVmVjdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZlY3Rvcih4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB2b2lkIDApIHsgeCA9IDA7IH1cbiAgICAgICAgaWYgKHkgPT09IHZvaWQgMCkgeyB5ID0gMDsgfVxuICAgICAgICB0aGlzLlggPSAwO1xuICAgICAgICB0aGlzLlkgPSAwO1xuICAgICAgICB0aGlzLlggPSB4O1xuICAgICAgICB0aGlzLlkgPSB5O1xuICAgIH1cbiAgICBWZWN0b3IucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2KSB7IHRoaXMuWCA9IHYuWDsgdGhpcy5ZID0gdi5ZOyB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUuYWRkVmVjdG9yID0gZnVuY3Rpb24gKHYpIHsgdGhpcy5YICs9IHYuWDsgdGhpcy5ZICs9IHYuWTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0VmVjdG9yID0gZnVuY3Rpb24gKHYpIHsgdGhpcy5YIC09IHYuWDsgdGhpcy5ZIC09IHYuWTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnNjYWxhck11bHRpcGx5ID0gZnVuY3Rpb24gKG4pIHsgdGhpcy5YICo9IG47IHRoaXMuWSAqPSBuOyB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUuZ2V0TGVuZ3RoU3EgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLlggKiB0aGlzLlggKyB0aGlzLlkgKiB0aGlzLlk7IH07XG4gICAgVmVjdG9yLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbiAoKSB7IHJldHVybiBNYXRoLnNxcnQodGhpcy5nZXRMZW5ndGhTcSgpKTsgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnNldExlbmd0aCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHZhciBsZW4gPSBNYXRoLnNxcnQodGhpcy5nZXRMZW5ndGhTcSgpKTtcbiAgICAgICAgdGhpcy5zY2FsYXJNdWx0aXBseShuIC8gbGVuKTtcbiAgICB9O1xuICAgIFZlY3Rvci5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24gKGFuZykge1xuICAgICAgICBfYSA9IFt0aGlzLlggKiBNYXRoLmNvcyhhbmcpIC0gdGhpcy5ZICogTWF0aC5zaW4oYW5nKSxcbiAgICAgICAgICAgIHRoaXMuWCAqIE1hdGguc2luKGFuZykgKyB0aGlzLlkgKiBNYXRoLmNvcyhhbmcpXSwgdGhpcy5YID0gX2FbMF0sIHRoaXMuWSA9IF9hWzFdO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLnNldFJUaGV0YSA9IGZ1bmN0aW9uIChyLCB0aGV0YSkge1xuICAgICAgICBfYSA9IFtyICogTWF0aC5jb3ModGhldGEpLCByICogTWF0aC5zaW4odGhldGEpXSwgdGhpcy5YID0gX2FbMF0sIHRoaXMuWSA9IF9hWzFdO1xuICAgICAgICB2YXIgX2E7XG4gICAgfTtcbiAgICBWZWN0b3IucHJvdG90eXBlLmdldEFuZ2xlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gTWF0aC5hdGFuMih0aGlzLlksIHRoaXMuWCk7IH07XG4gICAgcmV0dXJuIFZlY3Rvcjtcbn0oKSk7XG5leHBvcnRzLlZlY3RvciA9IFZlY3RvcjtcbmZ1bmN0aW9uIGdldERpc3RhbmNlKGEsIGIpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KChhLlggLSBiLlgpICogKGEuWCAtIGIuWCkgKyAoYS5ZIC0gYi5ZKSAqIChhLlkgLSBiLlkpKTtcbn1cbmV4cG9ydHMuZ2V0RGlzdGFuY2UgPSBnZXREaXN0YW5jZTtcbmZ1bmN0aW9uIGFuZ2xlRGlmZihiMVJhZCwgYjJSYWQpIHtcbiAgICB2YXIgYjF5ID0gTWF0aC5jb3MoYjFSYWQpO1xuICAgIHZhciBiMXggPSBNYXRoLnNpbihiMVJhZCk7XG4gICAgdmFyIGIyeSA9IE1hdGguY29zKGIyUmFkKTtcbiAgICB2YXIgYjJ4ID0gTWF0aC5zaW4oYjJSYWQpO1xuICAgIHZhciBjcm9zc3AgPSBiMXkgKiBiMnggLSBiMnkgKiBiMXg7XG4gICAgdmFyIGRvdHAgPSBiMXggKiBiMnggKyBiMXkgKiBiMnk7XG4gICAgaWYgKGNyb3NzcCA+IDAuKVxuICAgICAgICByZXR1cm4gTWF0aC5hY29zKGRvdHApO1xuICAgIHJldHVybiAtTWF0aC5hY29zKGRvdHApO1xufVxuZXhwb3J0cy5hbmdsZURpZmYgPSBhbmdsZURpZmY7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12ZWN0b3IuanMubWFwIl19
