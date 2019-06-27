require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const signVerificationMiddleware = require('./verify_sign')

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
if (!SIGNING_SECRET) {
    console.error('SLACK_SIGNING_SECRET is required')
    process.exit(1)
}

const PORT = process.env.PORT;
if (!PORT) {
    console.error('PORT is required')
    process.exit(1)
}

const LD_API_KEY = process.env.LD_API_KEY;
if (!LD_API_KEY) {
    console.error('LD_API_LEY is required')
    process.exit(1)
}

const ALLOWED_USER = process.env.ALLOWED_USER;
if (!ALLOWED_USER) {
    console.error('LD_API_LEY is required')
    process.exit(1)
}

const ALLOWED_CHANNEL = process.env.ALLOWED_CHANNEL;
if (!ALLOWED_CHANNEL) {
    console.error('LD_API_LEY is required')
    process.exit(1)
}

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
