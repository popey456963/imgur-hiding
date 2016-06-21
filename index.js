var images = require('images')
var jimp = require("jimp")
var mkdirp = require('mkdirp')
var request = require('request')
var async = require('async')
var fs = require('fs')

var express = require('express')
var app = express()

app.use(express.static('static'))

mkdirp.sync('./static/cover')
mkdirp.sync('./static/image')
mkdirp.sync('./static/output')

app.get('/merge', function(req, res) {

  // JPG doesn't suport opacity, so when coverURL is .jpg this doesn't work

  imageURL = "https://i.imgur.com/s1Ns3Vr.jpg"
  imagefiletype = imageURL.split(".")
  imagefiletype = imagefiletype[imagefiletype.length - 1]
  coverURL = "https://i.imgur.com/yNAsDDD.png"
  coverfiletype = coverURL.split(".")
  coverfiletype = coverfiletype[coverfiletype.length - 1]

  var guid = String(parseInt(Math.random() * 10000000)).replace(".", "")
  var imageName = "./static/image/" + guid + "." + imagefiletype
  var coverName = "./static/cover/" + guid + "." + coverfiletype
  var outputName = "./static/output/" + guid + ".png"
  var ourputURL = "merge.sinisterheavens.com/output/" + guid + ".png"

  console.log("GUID: " + guid)

  async.parallel([
    function(callback) {
      request(imageURL).pipe(fs.createWriteStream(imageName)).on('close', function(err) { callback(err) })
    },
    function(callback) {
      request(coverURL).pipe(fs.createWriteStream(coverName)).on('close', function(err) { callback(err) })
    },
  ],
  function(err, results) {
    if (err) console.log(err)
    console.log(results)
    // Read in the coverName file
    jimp.read(coverName, function (err, image) {
      if (err) console.log(err)
      // Change the opacity of the covername to 0.5 and write it to the same name
      image.opacity(0.5).flip(true, true).write(coverName, function() {
        // Read the image file, draw onto it the cover file and save it to output
        images(imageName).draw(images(coverName), 0, 0).save(outputName)
        request.post({
          headers: { "Content-Type": "application/json", "Authorization": "Client-ID 30864587c095d69" },
          url:     "https://api.imgur.com/3/image/",
          body:    { image: outputURL },
          json:    true
        }, function(error, response, body) {
          console.log(JSON.stringify(body))
          res.send(JSON.parse(body)["data"]["link"])
        })
      })
    })
  }
  )
})


app.listen(6666, function () {
  console.log('Image Merger Started Successfully!')
});