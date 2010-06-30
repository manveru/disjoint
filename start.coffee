fs: require 'fs'
spawn: require('child_process').spawn
sys: require 'sys'
path: require 'path'
crypto: require 'crypto'
Buffer: require('buffer').Buffer

Base64: require './base64'
Haml: require 'haml'
cradle: require 'cradle'
Router: require 'biggie-router'
router: new Router()

cradleConn: new cradle.Connection(
  'localhost', 5984, { cache: true, raw: false }
)

db: cradleConn.database('disjoint')
db.create()

if false
  # Story
  #   ctime
  #   author
  #   image
  #   pictures
  #   remaining
  #
  # Picture
  #   ctime
  #   author
  #   image

  time: new Date()

  story0: {
    type: 'story'
    author: 'manveru.myopenid.com'
    image: '5d59474e598004e0395b01679d6ae488da77f8a2.png'
    pictures: [
      'picture-0'
      'picture-1'
      'picture-2'
      'picture-3'
      'picture-4'
      'picture-5'
      'picture-6'
      'picture-7'
      'picture-8'
      'picture-9'
      'picture-10'
    ]
    remaining: 0
    ctime: time.getTime()
  }

  for n in [0..10]
    picture: {
      type: 'picture'
      author: 'manveru'
      image: '5d59474e598004e0395b01679d6ae488da77f8a2.png'
      ctime: time.getTime()
    }
    db.insert "picture-${n}", picture

  db.insert 'story-0', story0

p: (obj) -> sys.puts(sys.inspect(obj, false, 5))

# coming to a node.js near you soon
pump: (readStream, writeStream, callback) ->
  readStream.addListener "data", (chunk) ->
    readStream.pause() if writeStream.write(chunk) is false

  writeStream.addListener "drain", ->
    readStream.resume()

  readStream.addListener "end", ->
    writeStream.end()

  readStream.addListener "close", ->
    callback if callback


withRequestBody: (req, callback) ->
  chunks: []

  req.addListener 'data', (chunk) ->
    chunks.push chunk

  req.addListener 'end', ->
    totalLength: chunks.reduce (sum, chunk) ->
      sum + chunk.length
    , 0
    body: new Buffer(totalLength)
    offset: 0
    for chunk in chunks
      length: chunk.length
      chunk.copy body, offset, 0, length
      offset += length
    callback(body)

templates: {}

compile: (path) ->
  fs.readFile path, 'utf8', (error, data) ->
    if error
      sys.puts error
    else
      try
        compiled: Haml.compile(data)
        optimized: Haml.optimize(compiled)
        templates[path]: optimized
      catch error
        sys.puts error

fs.readdir 'view', (err, files) ->
  throw err if err
  for file in files
    file: "view/${file}"
    if path.extname(file) is '.haml'
      compile file
      fs.watchFile file, (curr, prev) ->
        if prev.mtime != curr.mtime
          compile(file)

# watch and recompile .coffee files that are used in the browser.
for js in ['disjoint.coffee', 'base64.coffee']
  proc: spawn('coffee', ['-w', '-c', js, '-o', './public'])
  proc.stdout.addListener 'data', (data) ->
    sys.print "stdout: $data"
  proc.stderr.addListener 'data', (data) ->
    sys.print "stderr: $data"
  proc.addListener 'exit', (code) ->
    sys.puts "child process exited with code $code"

respondWith: (res, name, locals) ->
  res.sendBody 200, renderContent(name, locals), {'Content-Type': 'text/html'}

renderContent: (name, locals) ->
  locals['content']: Haml.execute(templates["view/${name}.html.haml"], this, locals)
  Haml.execute(templates['view/layout.html.haml'], this, locals)

renderError: (res, error) ->
  locals: {
    error: error,
    title: error,
  }
  res.sendBody 200, renderContent('error', locals), {'Content-Type': 'text/html'}

pendingStories: (doc) ->
  if doc.type is 'story'
    if doc.remaining > 0
      emit doc._id, doc

completedStories: (doc) ->
  if doc.type is 'story'
    if doc.remaining is 0
      emit doc._id, doc

db.insert '_design/story', {
  frontpage: { map: completedStories }
  pending:   { map: pendingStories }
}

router.get('/').
       get('/index').
       bind (req, res, next) ->
  db.view 'story/frontpage', (err, result) ->
    if err
      renderError(res, err)
    else
      stories: []
      result.forEach (row) -> stories.push row
      respondWith res, 'index', {
        title: 'The Game of Miscommunication'
        stories: stories
      }

router.get('/draw').bind (req, res, next) ->
  respondWith res, 'draw', {
    title: 'Draw an image that matches the narrative'
    colors: [
      "#fff", "#7ff", "#000", "#630", "#f90", "#fc1", "#0f0", "#0ff", "#00f",
      "#f0f", "#f00" ]
    pencils: [ 1, 2, 4, 8, 16 ]
  }

router.get('/play').bind (req, res, next) ->
  db.view 'story/pending', (err, result) ->
    if err
      renderError(res, err)
    else
      stories: []
      result.forEach (row) -> stories.push row
      if stories.length > 0
        story: story[0]
        pid: story.remaining - 1
        picture
      else
        # start a new story
        respondWith res, 'write', {
          title: 'Write the beginning of a new story'
        }

router.post('/save_write').bind (req, res, next) ->
  withRequestBody req, (body) ->
    p 'save_write'
    p body.toString('utf8')

router.post('/save_draw').bind (req, res, next) ->
  withRequestBody req, (body) ->
    binary: Base64.decode(body.toString('binary'))
    hash: crypto.createHash('sha1')
    hash.update(binary)
    sum: hash.digest('hex')
    fs.writeFile "public/postit/${sum}.png", binary, 'binary', (err) ->
      throw err if err
      res.sendBody 200, 'Image saved'

router.get(/\.(css|js|svg)$/).module 'gzip'
router.module 'static', './public'
router.bind (req, res, next) ->
  res.sendBody 404, "File not found"

router.listen 8080
