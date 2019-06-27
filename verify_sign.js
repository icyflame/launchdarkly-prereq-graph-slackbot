/**
 * Verify the Slack signing secret in Node.js
 *
 * **Key:** You must call one of the parsers so that the `req.body` variable has a valid key-value
 * map before this middleware is called.
 *
 * Example usage: (verified)
 *
 * const app = express();
 * app.use(express.urlencoded({ extended: true }));
 * app.use(signVerificationMiddleware(process.env.SLACK_SIGNING_SECRET));
 *
 * Modified from the code on this post:
 * - https://medium.com/@rajat_sriv/verifying-requests-from-slack-using-node-js-69a8b771b704
 */

const crypto = require('crypto');
const qs = require('qs');

const signVerificationMiddleware = (slackSigningSecret) => (req, res, next) => {
    const slackSignature = req.headers['x-slack-signature'] || '';
    const requestBody = qs.stringify(req.body, {format : 'RFC1738'});
    const timestamp = req.headers['x-slack-request-timestamp'] || '';

    const time = Math.floor(new Date().getTime()/1000);

    if (Math.abs(time - timestamp) > 300) {
        return res.status(400).send('Ignore this request.');
    }

    if (!slackSigningSecret) {
        return res.status(400).send('Slack signing secret is empty.');
    }

    const sigBasestring = 'v0:' + timestamp + ':' + requestBody;
    const mySignature = 'v0=' +
        crypto.createHmac('sha256', slackSigningSecret)
        .update(sigBasestring, 'utf8')
        .digest('hex');

    if (crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(slackSignature, 'utf8'))
    ) {
        next();
    } else {
        return res.status(403).send('Verification failed');
    }
}

module.exports = {
    signVerificationMiddleware,
}
