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

