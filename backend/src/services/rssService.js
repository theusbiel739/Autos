const Parser = require('rss-parser');

const parser = new Parser();

async function parseFeed(url) {
  return parser.parseURL(url);
}

module.exports = {
  parseFeed
};
