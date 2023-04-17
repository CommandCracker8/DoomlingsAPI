const http = require('http');
const https = require('https');
const cheerio = require('cheerio');

function getRawFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (resp) => {
      let data = '';

      // A chunk of data has been received
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received
      resp.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function getJqueryFromUrl(url) {
  return getRawFromUrl(url)
    .then((rawHtml) => {
      const $ = cheerio.load(rawHtml);
      return Promise.resolve($);
    });
}

function getJsonFromUrl(url) {
  return getRawFromUrl(url)
    .then((rawData) => {
        try {
        const jsonData = JSON.parse(rawData);
        return Promise.resolve(jsonData);
        } catch (error) {
        return Promise.reject(error);
        }
    });
}


function getEnumKey(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}


const CardType = {
    Trait: "Trait",
    Age: "Age"
}

// function getCards(filters)
function getCard(id) {
    const url = `https://www.worldofdoomlings.com/cards/${id}`

    return getJqueryFromUrl(url)
        .then(($) => {
            const img = $('body > div.card-detail-section.wf-section > div > div > div > div.card-image-column.w-col.w-col-6 > a.lightbox-main.w-inline-block.w-lightbox > img');
            const flavourText = $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div.flavor-text > div')
            const effectText = $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(3) > div')
            const cardType = $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.card-type > div.property-pill > div')
            const subTypes = [];

            $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.subtype > div.w-dyn-list > div')
                .find('div.subtype-value')
                .each((index, element) => {
                    subTypes.push($(element).text().trim());
                });

            const cardInfo = {
                cardImage: img,
                cardImageUrl: img.attr('src'),
                flavourText: flavourText.html(),
                effectText: effectText.html(),
                cardType: getEnumKey(CardType, cardType.html()),
                subTypes: subTypes
            }

            return Promise.resolve(cardInfo)
        })
}


getCard('echolocation-ks')
    .then((card) => {
        console.log(card)
    })