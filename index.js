const express = require('express')
const morgan = require('morgan')

const app = express()

app.use(morgan('tiny'))

app.post('/', function (req, res) {
  res.send('Hello World')
})

console.log("Listening on port 3000")
app.listen(3000)
