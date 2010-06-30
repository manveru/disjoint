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
      canvas.hasClass('draw') ? this.initDraw() : null;
    } else if ($('#write').length > 0) {
      this.initWrite();
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
    return this.startCountdown(5 * 60, this.saveDraw);
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
    var self;
    this.noteTextControl(this);
    self = this;
    $('#writeDone').click(function(event) {
      return self.saveWrite(self);
    });
    return this.startCountdown(5 * 60, this.saveWrite);
  };
  Disjoint.prototype.noteTextControl = function(self) {
    var paragraphs, text;
    if ($('#write').height() > 320) {
      paragraphs = $('#write p').map(function() {
        if (this.innerText !== '') {
          return this.innerText;
        }
      });
      text = paragraphs.toArray().join("\n");
      text = text.slice(0, (text.length - 1));
      $('#write p').text(function(index, old) {
        if (index === 0) {
          return text;
        } else {
          return "";
        }
      });
    }
    return setTimeout(self.noteTextControl, 200, self);
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
    gradient.addColorStop(0.2, "#ffe68f");
    gradient.addColorStop(1, "#fde873");
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
  Disjoint.prototype.startCountdown = function(seconds, onDone) {
    this.timeLeft = seconds;
    return this.countdown(this, onDone);
  };
  Disjoint.prototype.countdown = function(self, onDone) {
    var min, sec;
    self.timeLeft -= 1;
    if (self.timeLeft > 0) {
      min = Math.floor(self.timeLeft / 60);
      if (min < 10) {
        min = ("0" + (min));
      }
      sec = self.timeLeft % 60;
      if (sec < 10) {
        sec = ("0" + (sec));
      }
      $('#countdown').replaceWith(("<span id='countdown'>" + (min) + ":" + (sec) + "</span>"));
      return setTimeout(self.countdown, 1000, self);
    } else {
      return onDone(self);
    }
  };
  Disjoint.prototype.saveDraw = function(self) {
    var data, png;
    data = self.canvas[0].toDataURL();
    png = data.slice('data:image/png;base64,'.length, data.length);
    return jQuery.post('/saveDraw', png);
  };
  Disjoint.prototype.saveWrite = function(self) {
    var data, paragraphs, text;
    data = self;
    paragraphs = $('#write p').map(function() {
      if (this.innerText !== '') {
        return this.innerText;
      }
    });
    text = paragraphs.toArray().join("\n");
    return jQuery.post('/save_write', text);
  };

  document.Disjoint = Disjoint;
})();
