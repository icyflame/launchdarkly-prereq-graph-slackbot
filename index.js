require('dotenv').config()

const {
    createReadStream,
    promises: fsPromises,
} = require('fs');

const express = require('express')
const morgan = require('morgan')

const { signVerificationMiddleware } = require('./verify_sign')
const { getLDConfiguration } = require('./launchdarkly_api_call')
const { gen_digraph } = require('./gen_digraph')

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

        const FORMAT = 'svg';
        const FILENAME = 't1.svg';

        getLDConfiguration(LD_API_KEY).
            then(({ flag_items_with_prereqs, flat_mapping }) => {
                const num_flags = flag_items_with_prereqs.length;
                const num_relations = flat_mapping.length;
                const premessage = [
                    'Fetched flags from LD as expected! Preparing the graph file!',
                    `${num_flags} flags with ${num_relations} pre-requisite relations!`,
                ].join('\n')

                web.chat.postMessage({
                    channel: req.body.channel_id,
                    text: premessage,
                })

                const { digraph } = gen_digraph({ flag_items_with_prereqs, flat_mapping })

                return digraph
            }, (error) => {
                console.log('Error: ', error);
                web.chat.postMessage({
                    channel: req.body.channel_id,
                    text: 'There was an error while trying to call the LaunchDarkly API',
                })
            }).
            then(async (digraph) => {
                rendered = await new Promise((accept, reject) => {
                // TODO: Take format from the given command;
                    digraph.output(FORMAT, (rendered) => {
                        accept(rendered)
                    })
                })
                return rendered
            }).
            then(async (rendered) => {
                result = await web.files.upload({
                    channels: req.body.channel_id,
                    // TODO: Use a human readable filename here: example:
                    // LD-US-PREREQ-2019-06-24-09-21-JST.svg
                    filename: FILENAME,
                    filetype: FORMAT,
                    file: rendered,
                })

                console.log('File uploaded: ', result.file.id)
            })
    })

app.listen(3000, (err) => {
    console.log('Listening on port 3000')
})
