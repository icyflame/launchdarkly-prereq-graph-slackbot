require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const signVerificationMiddleware = require('./verify_sign')

const {
    SIGNING_SECRET,
    PORT,
    LD_API_KEY,
    ALLOWED_USER,
    ALLOWED_CHANNEL,
} = require('./get_env')

const { WebClient } = require('@slack/web-api');
const token = process.env.BOT_ACCESS_TOKEN;
const web = new WebClient(token);

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(signVerificationMiddleware(SIGNING_SECRET))
app.use(morgan('tiny'))

app.route('/beepboop')
    .get((req, res) => {
        res.json({
            message: 'POSTを使ってください',
        })
    })
    .post((req, res) => {
        if (req.body.user_id !== ALLOWED_USER) {
            return res.sendStatus(200)
        }

        if (req.body.channel_id !== ALLOWED_CHANNEL) {
            return res.sendStatus(200)
        }

        web.chat.postMessage({
            channel: req.body.channel_id,
            text: 'I will post the pre-requisites graph to this channel _soon_',
        })

        res.json({
            response_type: 'ephemeral',
            text: '作業中です',
        })
    })

app.listen(3000, (err) => {
    console.log("Listening on port 3000")
})
