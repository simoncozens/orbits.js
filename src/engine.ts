import {Vector, getDistance} from "./vector";
import {OBObject} from "./object";
import {AccelerationPoint, Path} from "./path";

var MARS_APOGEE = 249209300.0;
var SUN_SGP = 132712440018.0;
var MARS_APOGEE_VEL = 21.97;
var MARS_AOP = 4.9997;
var EARTH_APOGEE = 152098232.0;
var EARTH_APOGEE_VEL = 29.3;
var EARTH_AOP = 1.99330;
var root = this;
var POINTS_TIME = 86400.0;

enum UIMode { Normal, Playback, AddingPoint, Inert, };

class EngineSingleton {
  public center: Vector;
  public kmPerPixel : number;
  // cached for perf
  public screenW: number;
  public screenH: number;

  // bodies
  public sun: OBObject;
  public venus: OBObject;
  public earth: OBObject;
  public mars: OBObject;

  public ship: Path;
  public venusPath: Path;
  public earthPath: Path;
  public marsPath: Path;

  // UI stuff
  public uiMode: UIMode = UIMode.Normal;
  public hoverPathPointIdx = -1;
  public hoverAccelPoint: AccelerationPoint;
  public msg;
  public ctx : CanvasRenderingContext2D;

  constructor () {
  }

  public init(el?) {
    if (el) {
      this.screenW = el.width();
      this.screenH = el.height();
      this.ctx = el[0].getContext("2d");
      $(el).on("mousemove", (e) => this.mouseMove(e) )
      $(el).on("touchmove", (e) => this.mouseMove(e) )
      $(window).keydown( (e) => this.keyDown(e) )
      $(window).keyup( (e) => this.keyUp(e) )
    } else {
      this.screenW = 640;
      this.screenH = 480;
    }
    this.center = new Vector();
    var r = MARS_APOGEE*1.05;
    var width = r*2.0;
    var narrowest = this.screenW < this.screenH ? this.screenW : this.screenH;
    this.kmPerPixel = 1.2*width/narrowest;
    var sunPos = new Vector(); var sunVel = new Vector();
    this.sun = new OBObject(SUN_SGP, sunPos, sunVel, "#ffff00", 8, null);
    this.mars = new OBObject(0, new Vector(), new Vector(), "#ff7f7f", 1, this.sun);
    this.mars.initOrbiter(this.sun, MARS_APOGEE, MARS_APOGEE_VEL, MARS_AOP);
    this.earth = new OBObject(0, new Vector(), new Vector(), "#7f7fff", 1, this.sun);
    this.earth.initOrbiter(this.sun, EARTH_APOGEE, EARTH_APOGEE_VEL, EARTH_AOP);

    this.marsPath = new Path();
    this.marsPath.initNoAccOrbiterAngle(this.mars, 5.4429575522);
    this.earthPath = new Path();
    this.earthPath.initNoAccOrbiterAngle(this.earth, 4.9745875522);

    this.ship = new Path();
    this.ship.init(this.sun, this.earthPath.startPos, this.earthPath.startVel, "#7f7f7f", 5);
  }

  // playback stuff
  public playbackStepIdx;
  public modelToViewX(modelX):number {
    var x = modelX - this.center.X;
    x /= this.kmPerPixel;
    return x + this.screenW/2;
  }
  public modelToViewY(modelY):number {
    var y= modelY - this.center.Y;
    y /= this.kmPerPixel;
    return y + this.screenH/2;
  }

  public drawSelf() {
    this.setupCanvas();
    if (this.uiMode == UIMode.Playback) {
      this.drawPlayback()
    } else {
      this.drawNormal()
    }
  }

  public setupCanvas() {
    this.ctx.canvas.width = this.screenW;
    this.ctx.canvas.height = this.screenH;
    this.ctx.clearRect(0,0,this.screenW, this.screenH);
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0,0,this.screenW, this.screenH);
    this.sun.drawSelf();
    this.earthPath.drawSelf();
    this.marsPath.drawSelf();
  }

  public drawPlayback() {
    this.ship.drawProgressivePath(this.playbackStepIdx);
    this.ctx.fillStyle=this.earth.color;
    this.drawPathObject(this.earthPath,this.playbackStepIdx);
    this.ctx.fillStyle=this.mars.color;
    this.drawPathObject(this.marsPath,this.playbackStepIdx);
    this.ctx.fillStyle=this.ship.color;
    this.drawPathObject(this.ship,this.playbackStepIdx);
    var missionDay = this.playbackStepIdx+1;
    var label = `Mission day: ${missionDay} `
    if ( missionDay >= 133 )
    {
      // work out the sol
      var sol = missionDay-132;
      sol *= 86400.0;
      sol /= 88775.24409;
      label = label + `Sol: ${sol.toFixed(0)}`;
    }
    this.ctx.fillStyle="#ffffff";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(label, 10,20);
  }

  public drawNormal() {
    this.ship.drawSelf(this.hoverAccelPoint);

    if (this.hoverPathPointIdx != -1) {
      this.ctx.strokeStyle="#ff0000";
      this.ship.drawThrustLine(this.hoverPathPointIdx);
      var daynum = (this.hoverPathPointIdx*86400)/POINTS_TIME + 1;
      var em = getDistance(this.earthPath.points[this.hoverPathPointIdx], this.marsPath.points[this.hoverPathPointIdx]);
      var eh = getDistance(this.earthPath.points[this.hoverPathPointIdx], this.ship.points[this.hoverPathPointIdx]);
      var hm = getDistance(this.marsPath.points[this.hoverPathPointIdx], this.ship.points[this.hoverPathPointIdx]);
      this.ctx.fillStyle="#ffffff";
      this.ctx.font = "12px Arial";
      this.ctx.fillText(`Day: ${daynum.toFixed(0)}`, 10,20);
      this.ctx.fillText(`Earth-Mars: ${this.distInfo(em)}`, 10,36);
      this.ctx.fillText(`Earth-Hermes: ${this.distInfo(eh)}`, 10,52);
      this.ctx.fillText(`Hermes-Mars: ${this.distInfo(hm)}`, 10,68);
    }
    var idx = this.hoverPathPointIdx;
    if (idx <1) { idx = 0; }
    this.ctx.fillStyle=this.earth.color;
    this.drawPathObject(this.earthPath,idx);
    this.ctx.fillStyle=this.mars.color;
    this.drawPathObject(this.marsPath,idx);
  }

  public drawPathObject(toDraw: Path, pointIdx) {
    var stopPoint = toDraw.getStopPoint();
    if (pointIdx > stopPoint) return;
    var x = this.modelToViewX(toDraw.points[pointIdx].X);
    var y = this.modelToViewY(toDraw.points[pointIdx].Y);
    Engine.ctx.beginPath();
    Engine.ctx.arc(x,y,5,0,2*Math.PI);
    Engine.ctx.fill();

  }

  public distInfo(dist: number) {
    var lightSeconds = dist/300000;
    var lightMinutes = lightSeconds/60;
    lightSeconds = lightSeconds%60;
    return `${dist.toFixed(0)}km, ${lightMinutes.toFixed(0)}m ${lightSeconds.toFixed(0)}s`;
  }

  public load(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    var that = this;
    xhr.onload = function (e) {
      // response is unsigned 8 bit integer
      var dv = new DataView(this.response);
      var off = 0;
      off = that.earthPath.load(dv,off);
      off = that.marsPath.load(dv,off);
      off = that.ship.load(dv,off);
      that.drawSelf();
    };
    xhr.send();
  }

  public mouseMove(evt) {
    var rect = $("#canvas")[0].getBoundingClientRect();
    var x = (evt.clientX||evt.touches[0].clientX) - rect.left;
    var y = (evt.clientY||evt.touches[0].clientY) - rect.top;
    // if (this.uiMode == UIMode.AddingPoint) {
      this.hoverPathPointIdx = this.ship.getNearestPointIdx(x,y);
    // } else {
      this.hoverAccelPoint = this.ship.getNearestAccelPoint(x,y);
    // }
    this.drawSelf();
    evt.preventDefault();
  }

  public playbackTick() {
    if (this.uiMode != UIMode.Playback) return;
    var stopIdx = this.ship.getStopPoint();
    if (this.playbackStepIdx <= stopIdx) {
      this.drawSelf();
      this.playbackStepIdx++;
      setTimeout(() => this.playbackTick(), 320 - ($("#speed").val() as number));
    } else {
      this.playPause();
    }
  }

  public playPause() {
    if (this.uiMode != UIMode.Playback) {
      this.playbackStepIdx = 0;
      this.uiMode = UIMode.Playback;
      this.playbackTick();
      $("#pause").show(); $("#play").hide();
    } else {
      this.uiMode = UIMode.Inert;
      $("#play").show(); $("#pause").hide();
    }
  }

  public keyDown(evt) {
    var key = evt.key;
    if (key == "Shift") {
      this.hoverPathPointIdx = -1;
      this.hoverAccelPoint = null;
      this.uiMode = UIMode.AddingPoint;
    }
    if (key == " ") {
      this.playPause();
    }
  }

  public keyUp(evt) {
    var key = evt.key;
    if (key == "Shift") {
      this.hoverPathPointIdx = -1;
      this.hoverAccelPoint = null;
      this.uiMode = UIMode.Normal;
    }
  }

};

export var Engine = new EngineSingleton();