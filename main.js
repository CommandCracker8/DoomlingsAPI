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
            const colors = [];
            const points = $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.points > div.property-pill > div')
            const collection = $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.collections > div.property-pill > div')

            // $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.subtype > div.w-dyn-list > div')
            //     .find('div.subtype-value')
            //     .each((index, element) => {
            //         subTypes.push($(element).text().trim());
            //     });


            $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.subtype > div.w-dyn-list > div')
                .children('')
                .each((index, element) => {
                    const text_element = cheerio.load(element)("div > div.subtype-value")
                    subTypes.push(text_element.html())
                })

            $('body > div.card-detail-section.wf-section > div > div > div > div.card-stats-column.w-col.w-col-6 > div > div:nth-child(8) > div.color > div.collection-list-wrapper-2.w-dyn-list > div')
                .children('')
                .each((index, element) => {
                    const text_element = cheerio.load(element)("div:nth-child(1) > div > div")
                    colors.push(text_element.html())
                })

            const cardInfo = { // TODO: add image base64
                // cardImage: img,
                cardImageUrl: img.attr('src'),
                flavourText: flavourText.html(),
                effectText: effectText.html(),
                cardType: getEnumKey(CardType, cardType.html()),
                subTypes: subTypes,
                colors: colors,
                points: points.html(),
                collection: collection.html()
            }

            return Promise.resolve(cardInfo)
        })
}

class SearchFilter {
	constructor(required, multiple_choice, boosterId, options, prefix="", suffix="") {
		this.required = required
		this.multiple_choice = multiple_choice
		this.options = options
        this.boosterId = boosterId
        
        this.prefix = prefix
        this.suffix = suffix
	}

    isValid(filter) {
        return this.options.includes(filter)
    }

    preProcess(filter) {
        return this.prefix + filter + this.suffix
    }
}

// const searchFilters = {
// 	edition:      new SearchFilter(true, false, ["kickstarter", "retail"]),
// 	collections:  new SearchFilter(false, true, ["Classic", "KSE", "Multi-Color", "Dinolings", "Mythlings", "Techlings", "Meaning of Life", "Overlush"]),
// 	cardTypes:    new SearchFilter(false, true, ["Trait", "Age", "Sign"]),
// 	cardSubTypes: new SearchFilter(false, true, ["Dominant", "Action", "Play When", "Drop of Life", "Persistent", "Gene Pool", "Catastrophe", "World's End", "Effectless", "Requirement", "Attachment"]),
// 	cardColor:    new SearchFilter(false, true, ["Blue", "Green", "Colorless", "Purple", "Red", "Multi-color"]),
// 	cardPoints:   new SearchFilter(false, true, ["Zero or Less", "One", "Two", "Three", "Four", "Five", "Six or More", "Variable"]),
// 	rarity:       new SearchFilter(false, true, ["Common", "Unusual", "Scarce", "Endangered", "Legendary"])
// }
const searchFilters = {
	edition:      new SearchFilter(true, false, "cl3348kjy3y5y0752zfevuoth", ["kickstarter", "retail"], "", "-edition"),
	collections:  new SearchFilter(false, true, "cktvz4127jhgc07348lj2hfyk", ["classic", "kse", "multi-color", "dinolings", "mythlings", "techlings", "meaning-of-life", "overlush"]),
	cardTypes:    new SearchFilter(false, true, "cktu6a0pzd8ps07241dp0lr2r", ["trait", "age", "sign"]),
	cardSubTypes: new SearchFilter(false, true, "cktw1x6rk12550793aq3t3qfp", ["dominant", "action", "play-when", "drop-of-life", "persistent", "gene-pool", "catastrophe", "worlds-end", "effectless", "requirement", "attachment"]),
	cardColor:    new SearchFilter(false, true, "cktx0h82aelxw07931ql70o2g", ["blue", "green", "colorless", "purple", "red", "multi-color"]),
	cardPoints:   new SearchFilter(false, true, "cktx1jw40f68307931hyogg9v", ["zero-or-less", "one", "two", "three", "four", "five", "six-or-more", "variable"]),
	rarity:       new SearchFilter(false, true, "cle3adph40xd40678nt850q9e", ["common", "unusual", "scarce", "endangered", "legendary"])
}

// Card Edition: https://api.jetboost.io/filter?boosterId=cl3348kjy3y5y0752zfevuoth & q=retail-edition                                                                                                                           & v=2
// Collections : https://api.jetboost.io/filter?boosterId=cktvz4127jhgc07348lj2hfyk & q=classic&q=kse&q=multi-color&q=dinolings&q=mythlings&q=techlings&q=meaning-of-life&q=overlush                                             & v=2
// Card Type   : https://api.jetboost.io/filter?boosterId=cktu6a0pzd8ps07241dp0lr2r & q=trait&q=age&q=sign                                                                                                                       & v=2
// Card SubType: https://api.jetboost.io/filter?boosterId=cktw1x6rk12550793aq3t3qfp & q=dominant&q=action&q=play-when&q=drop-of-life&q=persistent&q=gene-pool&q=catastrophe&q=worlds-end&q=effectless&q=requirement&q=attachment & v=2
// Card Color  : https://api.jetboost.io/filter?boosterId=cktx0h82aelxw07931ql70o2g & q=blue&q=green&q=colorless&q=purple&q=red&q=multi-color                                                                                    & v=2
// Card Points : https://api.jetboost.io/filter?boosterId=cktx1jw40f68307931hyogg9v & q=zero-or-less&q=one&q=two&q=three&q=four&q=five&q=six-or-more&q=variable                                                                  & v=2
// Card Rarity : https://api.jetboost.io/filter?boosterId=cle3adph40xd40678nt850q9e & q=common&q=unusual&q=scarce&q=endangered&q=legendary                                                                                       & v=2

// function compendiumSearch({ edition, collections, cardTypes, cardSubTypes, cardColor, cardPoints, rarity }) {
async function searchCompendium(filters) {
	for (const key of Object.keys(searchFilters)) {
		const filtersApplied = filters[key] ?? []
		if (filtersApplied.length == 0 && searchFilters[key].required) {
			throw `Filter '${key}' has not been supplied but it is a required filter`
		}

		if (filtersApplied.length > 1 && !searchFilters[key].multiple_choice) {
			throw `Filter '${key}' is not multiple choice but ${filtersApplied.length} filters were provided`
		}

		if (!Array.isArray(filtersApplied) && searchFilters[key].multiple_choice) {
			throw `Non-array provided for multiple-choice filter ('${key}')`
		}

        for (const filterApplied of filtersApplied) {
            if (!searchFilters[key].isValid(filterApplied)) {
                throw `Invalid filter '${filterApplied}' provided for key '${key}'`
            }
        }
	}


    let cardsFound = []

    // Compile search URLs
    const searchURLs = []
    for (const key of Object.keys(filters)) {
        const filtersApplied = filters[key] ?? []
        const searchFilter = searchFilters[key]

        let baseUrl = `https://api.jetboost.io/filter?boosterId=${searchFilter.boosterId}`
        for (const filter of filtersApplied) {
            baseUrl += `&q=${searchFilter.preProcess(filter)}`
        }
        baseUrl += `&v=2`

        searchURLs.push(baseUrl)
    }
    
    
    // Resolve the search results
    const rawSearchResults = []
    for (const searchUrl of searchURLs) {
        // searchResults.append()
        const results = await getJsonFromUrl(searchUrl)
        rawSearchResults.push(results)
    }


    // Format the results
    const searchResults = []
    for (const results of rawSearchResults) {
        searchResults.push(Object.keys(results))
    }
    
    
    // Process the results
    cardsFound = searchResults.reduce((previous, current) => {
        return previous.filter(element => current.includes(element));
    });

    return Promise.resolve(cardsFound)
}

searchCompendium({edition: [ "retail" ], collections: [ "multi-color" ]})
  .then((cards) => {
    for (const card of cards) {
      console.log(card)
    }

    console.log(`Found ${cards.length} cards`)
  })


// getCard('echolocation-ks')
//     .then((card) => {
//         console.log(card)
//     })

// getCard('motley')
//     .then((card) => {
//         console.log(card)
//     })