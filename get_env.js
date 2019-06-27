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

module.exports = {
    SIGNING_SECRET,
    PORT,
    LD_API_KEY,
    ALLOWED_USER,
    ALLOWED_CHANNEL,
}
