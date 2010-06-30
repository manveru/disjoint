(function(){
  var Disjoint, TAU, p;
  p = function(obj) {
    if (console && console.debug) {
      return console.debug(obj);
    }
  };
  TAU = Math.PI * 2;
  Disjoint = function(canvas) {
    if (canvas.length > 0) {
      this.canvas = canvas;
      this.ctx = canvas[0].getContext('2d');
      canvas.hasClass('draw') ? this.initDraw() : this.initWrite();
    }
    return this;
  };
  Disjoint.prototype.initDraw = function() {
    var self;
    this.drawing = null;
    this.pencil = 5;
    self = this;
    this.canvas.bind('mousedown', function(event) {
      var _a, ctx, x, y;
      _a = self.mousepos(event);
      x = _a[0];
      y = _a[1];
      ctx = self.ctx;
      ctx.beginPath();
      ctx.fillStyle = self.color;
      ctx.arc(x, y, self.pencil / 2, 0, TAU, false);
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.moveTo(x, y);
      self.drawing = true;
      return self.drawing;
    });
    this.canvas.bind('mouseup', function(event) {
      var _a, ctx, x, y;
      _a = self.mousepos(event);
      x = _a[0];
      y = _a[1];
      ctx = self.ctx;
      self.drawing = false;
      ctx.closePath();
      ctx.beginPath();
      ctx.fillStyle = self.color;
      ctx.arc(x, y, self.pencil / 2, 0, TAU, false);
      ctx.fill();
      return ctx.closePath();
    });
    this.canvas.bind('mousemove', function(event) {
      if (self.drawing) {
        return self.mousemove(event);
      }
    });
    this.colors = $('.color');
    this.colors.bind('click', function(event) {
      var target;
      self.colors.removeClass('activeColor');
      self.colors.addClass('inactiveColor');
      target = $(event.target);
      target.removeClass('inactiveColor');
      target.addClass('activeColor');
      self.color = target.css('background-color');
      return self.refreshPencils();
    });
    this.pencils = $('.pencil');
    this.pencils.bind('click', function(event) {
      var target;
      self.pencils.removeClass('activePencil');
      self.pencils.addClass('inactivePencil');
      target = $(event.target);
      target.removeClass('inactivePencil');
      target.addClass('activePencil');
      self.pencil = parseInt(target.text());
      return self.refreshPencils();
    });
    this.color = this.colors.first().css('background-color');
    this.pencil = parseInt(this.pencils.first().text());
    this.refreshPencils();
    this.drawNote();
    return this.startDrawing();
  };
  Disjoint.prototype.refreshPencils = function() {
    var self;
    self = this;
    return this.pencils.each(function(n, pencil) {
      var ctx, diameter, jPencil, x, y;
      jPencil = $(pencil);
      diameter = parseInt(jPencil.text());
      pencil.width = diameter + 2;
      pencil.height = diameter + 2;
      ctx = pencil.getContext('2d');
      x = diameter + 1;
      y = diameter + 1;
      ctx.beginPath();
      ctx.fillStyle = self.color;
      jPencil.hasClass('activePencil') ? (ctx.strokeStyle = '#f00') : (ctx.strokeStyle = '#000');
      ctx.arc(x, y, diameter, 0, TAU, false);
      ctx.fill();
      ctx.stroke();
      return ctx.closePath();
    });
  };
  Disjoint.prototype.initWrite = function() {
    this.drawNote();
    return this.drawNoteText();
  };
  Disjoint.prototype.drawNoteText = function() {
    var text;
    text = $('#write').text();
    this.ctx.fillStyle = '#000';
    this.ctx.font = "50px StickIt";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    return this.ctx.fillText(text, 150, 10);
  };
  Disjoint.prototype.drawNote = function() {
    var bottom, c, gradient, left, right, top;
    c = this.canvas;
    top = 0;
    left = 0;
    bottom = c.attr('height');
    right = c.attr('width');
    gradient = this.ctx.createLinearGradient(bottom, left, top, right);
    gradient.addColorStop(0, "#ffe68f");
    // top right
    gradient.addColorStop(0.2, "#ffe68f");
    gradient.addColorStop(1, "#fde873");
    // bottom left
    this.ctx.beginPath();
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(top, left, bottom, right);
    return this.ctx.closePath();
  };
  Disjoint.prototype.mousemove = function(event) {
    var _a, radius, x, y;
    radius = this.pencil;
    _a = this.mousepos(event);
    x = _a[0];
    y = _a[1];
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.pencil;
    this.ctx.lineTo(x, y);
    return this.ctx.stroke();
  };
  Disjoint.prototype.mousepos = function(event) {
    var offset;
    offset = this.canvas.offset();
    return [event.pageX - offset.left, event.pageY - offset.top];
  };
  Disjoint.prototype.startDrawing = function() {
    this.timeLeft = 1 * 5;
    return this.countdown();
  };
  Disjoint.prototype.countdown = function(self) {
    var min, sec;
    self = (typeof self !== "undefined" && self !== null) ? self : this;
    self.timeLeft -= 1;
    if (self.timeLeft > 0) {
      min = Math.floor(self.timeLeft / 60);
      sec = self.timeLeft % 60;
      $('#countdown').replaceWith(("<span id='countdown'>" + (min) + ":" + (sec) + "</span>"));
      return window.setTimeout(self.countdown, 1000, self);
    } else {
      return self.save();
    }
  };
  Disjoint.prototype.save = function() {
    var data, png;
    data = this.canvas[0].toDataURL();
    png = data.slice('data:image/png;base64,'.length, data.length);
    return jQuery.post('/save', png);
  };

  document.Disjoint = Disjoint;
})();
