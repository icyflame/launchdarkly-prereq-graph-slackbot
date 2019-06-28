require('dotenv').config()

const {
    createReadStream,
    promises: fsPromises,
} = require('fs');

const express = require('express')
const morgan = require('morgan')
const _ = require('lodash')

const { signVerificationMiddleware } = require('./verify_sign')
const { transform_flag_name, getLDConfiguration } = require('./launchdarkly_api_call')
const { gen_digraph } = require('./gen_digraph')
const { keep_interested_flags } = require('./filter_flags')

const {
    SIGNING_SECRET,
    PORT,
    LD_API_KEY,
    ALLOWED_USER,
    ALLOWED_CHANNEL,
} = require('./get_env')

const DEFAULT_MAX_DEPTH = 10;
const MAX_ALLOWED_DEPTH = 15;

const getHelpMessage = () => {
    return [
        'LaunchDarkly Pre-Requisites Bot',
        '',
        '> Connected to the US project',
        '',
        'Examples:',
        '`/ld-prereqs help`',
        ' => Print this help text',
        '',
        '`/ld-prereqs`',
        ' => Return the pre-requisite graph of the complete US project',
        '',
        '`/ld-prereqs flag1;flag2;`',
        ' => Return the pre-requisite subgraph which contains these flags',
        '',
        '`/ld-prereqs flag1;flag2/2`',
        ' => Return the pre-requisite subgraph going upto 2 levels deep from these flags',
    ].join('\n');
}

const noPrereqMessage = (flags) => {
    return [
        'None of those flags have a pre-requisite or flags with these flags as a pre-requisite!',
        'Flags checked: ',
        ...flags.map(f => `- ${f}`)
    ].join('\n');
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
        const inputText = req.body.text;

        if (inputText === 'help') {
            return res.json({
                response_type: "ephemeral",
                text: getHelpMessage(),
            })
        }

        web.chat.postMessage({
            channel: req.body.channel_id,
            text: 'I will post the pre-requisites graph to this channel _soon_',
        })

        const FORMAT = 'svg';
        const now = new Date();
        let FILENAME = [
            'LD',
            'US',
            'PRE',
            'REQS',
            now.getFullYear(),
            now.getMonth()+1,
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
        ].join('-') + '.svg';

        const components = _.reject(inputText.split('/'), _.isEmpty)

        const flagsText = components.length >= 1 ? components[0] : '';

        let maxDepth = components.length >= 2 ? parseInt(components[1], 10) : DEFAULT_MAX_DEPTH;
        maxDepth = _.isNaN(maxDepth) ? DEFAULT_MAX_DEPTH : maxDepth;
        maxDepth = maxDepth > MAX_ALLOWED_DEPTH ? DEFAULT_MAX_DEPTH : maxDepth;

        let wantFlags = _.reject(flagsText.split(';'), _.isEmpty);
        wantFlags = wantFlags.map(transform_flag_name);

        (async () => {
            getLDConfiguration(LD_API_KEY).
                then(({ flag_items_with_prereqs, flat_mapping }) => {
                    const num_flags = flag_items_with_prereqs.length;
                    const num_relations = flat_mapping.length;
                    const premessage = [
                        'Fetched flags from LD as expected! Preparing the graph file!',
                        `${num_flags} flags with ${num_relations} pre-requisite relations!`,
                        `Output for: \`${req.body.command} ${req.body.text}\``,
                    ].join('\n')

                    web.chat.postMessage({
                        channel: req.body.channel_id,
                        text: premessage,
                    })

                    const {
                        filtered_flag_items,
                        filtered_flat_mapping,
                    } = keep_interested_flags({
                        flag_items_with_prereqs,
                        flat_mapping,
                        wantFlags,
                        maxDepth,
                    })

                    if (filtered_flag_items.length === 0) {
                        web.chat.postMessage({
                            channel: req.body.channel_id,
                            text: noPrereqMessage(wantFlags),
                        })
                        return undefined
                    }

                    const { digraph } = gen_digraph({
                        flag_items_with_prereqs: filtered_flag_items,
                        flat_mapping: filtered_flat_mapping,
                    })

                    return digraph
                }, (error) => {
                    console.log('Error: ', error);
                    web.chat.postMessage({
                        channel: req.body.channel_id,
                        text: 'There was an error while trying to call the LaunchDarkly API',
                    })
                }).
                then(async (digraph) => {
                    if (digraph === undefined) {
                        return
                    }

                    rendered = await new Promise((accept, reject) => {
                        // TODO: Take format from the given command;
                        digraph.output(FORMAT, (rendered) => {
                            accept(rendered)
                        })
                    })
                    return rendered
                }).
                then(async (rendered) => {
                    if (rendered === undefined) {
                        return
                    }

                    result = await web.files.upload({
                        channels: req.body.channel_id,
                        filename: FILENAME,
                        filetype: FORMAT,
                        file: rendered,
                    })

                    console.log('File uploaded: ', result.file.id)
                })
        })()

        res.sendStatus(200)
    })

app.listen(3000, (err) => {
    console.log('Listening on port 3000')
})
