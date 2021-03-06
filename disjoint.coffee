p: (obj) ->
  if console and console.debug
    console.debug obj

TAU: Math.PI * 2

class Disjoint
  constructor: (canvas) ->
    if canvas.length > 0
      @canvas: canvas
      @ctx: canvas[0].getContext('2d')
      if canvas.hasClass('draw')
        @initDraw()
    else if $('#write').length > 0
      @initWrite()

  initDraw: ->
    @drawing: null
    @pencil: 5

    self: this
    @canvas.bind 'mousedown', (event) ->
      [x, y]: self.mousepos(event)
      ctx: self.ctx

      ctx.beginPath()
      ctx.fillStyle: self.color
      ctx.arc x, y, self.pencil / 2, 0, TAU, false
      ctx.fill()
      ctx.closePath()

      ctx.beginPath()
      ctx.moveTo(x, y)
      self.drawing: true
    @canvas.bind 'mouseup', (event) ->
      [x, y]: self.mousepos(event)
      ctx: self.ctx

      self.drawing: false
      ctx.closePath()

      ctx.beginPath()
      ctx.fillStyle: self.color
      ctx.arc x, y, self.pencil / 2, 0, TAU, false
      ctx.fill()
      ctx.closePath()
    @canvas.bind 'mousemove', (event) ->
      if self.drawing
        self.mousemove event

    @colors: $('.color')
    @colors.bind 'click', (event) ->
      self.colors.removeClass('activeColor')
      self.colors.addClass('inactiveColor')
      target: $(event.target)
      target.removeClass('inactiveColor')
      target.addClass('activeColor')
      self.color: target.css('background-color')
      self.refreshPencils()

    @pencils: $('.pencil')
    @pencils.bind 'click', (event) ->
      self.pencils.removeClass('activePencil')
      self.pencils.addClass('inactivePencil')
      target: $(event.target)
      target.removeClass('inactivePencil')
      target.addClass('activePencil')
      self.pencil: parseInt(target.text())
      self.refreshPencils()

    @color: @colors.first().css('background-color')
    @pencil: parseInt(@pencils.first().text())
    @refreshPencils()
    @drawNote()
    @startCountdown(5 * 60, @saveDraw)

  refreshPencils: ->
    self: this
    @pencils.each (n, pencil) ->
      jPencil: $(pencil)
      diameter: parseInt(jPencil.text())
      pencil.width: diameter + 2
      pencil.height: diameter + 2
      ctx: pencil.getContext('2d')
      x: diameter + 1
      y: diameter + 1
      ctx.beginPath()
      ctx.fillStyle: self.color
      if jPencil.hasClass('activePencil')
        ctx.strokeStyle: '#f00'
      else
        ctx.strokeStyle: '#000'
      ctx.arc x, y, diameter, 0, TAU, false
      ctx.fill()
      ctx.stroke()
      ctx.closePath()

  initWrite: ->
    @noteTextControl(this)
    self: this
    $('#writeDone').click (event) ->
      self.saveWrite(self)
    @startCountdown(5 * 60, @saveWrite)

  noteTextControl: (self) ->
    if $('#write').height() > 320
      paragraphs: $('#write p').map ->
        return @innerText if @innerText != ''
      text: paragraphs.toArray().join("\n")
      text: text[0...(text.length - 1)]
      $('#write p').text (index, old) ->
        if index == 0
          return text
        else
          return ""
    setTimeout self.noteTextControl, 200, self

  drawNote: ->
    c: @canvas
    top: 0
    left: 0
    bottom: c.attr('height')
    right: c.attr('width')
    gradient: @ctx.createLinearGradient(bottom, left, top, right)
    gradient.addColorStop(0,   "#ffe68f") # top right
    gradient.addColorStop(0.2, "#ffe68f")
    gradient.addColorStop(1,   "#fde873") # bottom left
    @ctx.beginPath()
    @ctx.fillStyle: gradient
    @ctx.fillRect(top, left, bottom, right)
    @ctx.closePath()

  mousemove: (event) ->
    radius: @pencil
    [x, y]: @mousepos(event)
    @ctx.strokeStyle: @color
    @ctx.lineWidth: @pencil
    @ctx.lineTo x, y
    @ctx.stroke()

  mousepos: (event) ->
    offset: @canvas.offset()
    [event.pageX - offset.left, event.pageY - offset.top]

  startCountdown: (seconds, onDone) ->
    @timeLeft: seconds
    @countdown(this, onDone)

  countdown: (self, onDone) ->
    self.timeLeft -= 1
    if self.timeLeft > 0
      min: Math.floor(self.timeLeft / 60)
      min: "0${min}" if min < 10
      sec: self.timeLeft % 60
      sec: "0${sec}" if sec < 10
      $('#countdown').replaceWith("<span id='countdown'>${min}:${sec}</span>")
      setTimeout(self.countdown, 1000, self)
    else
      onDone(self)

  saveDraw: (self) ->
    data: self.canvas[0].toDataURL()
    png: data.slice('data:image/png;base64,'.length, data.length)
    jQuery.post('/saveDraw', png)

  saveWrite: (self) ->
    data: self
    paragraphs: $('#write p').map -> return @innerText if @innerText != ''
    text: paragraphs.toArray().join("\n")
    jQuery.post('/save_write', text)

document.Disjoint: Disjoint
