/* eslint no-restricted-syntax: 0 */
/* eslint-env browser */
/* eslint no-await-in-loop: 0 */

const puppeteer = require(`puppeteer`);
const fs = require(`fs`);

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://www.aritzia.com/us/en/clothing/blouses/blouses-longsleeve`, { waitUntil: `domcontentloaded` });
  await page.setViewport({ width: 1000, height: 800 });
  const urlArray = await lazyScroll(page); // scroll to last li
  return { page, urlArray };
};

// scroll down to trigger loading of more products
async function lazyScroll(page) {
  await page.evaluate(() => {
    const lastLi = document.querySelector(`ul.search-result-items > li:last-child`);
    if (lastLi) lastLi.scrollIntoView(false, { behavior: `smooth` });
  });
  await page.waitForNavigation({ waitUntil: `networkidle2` }); // wait for images to load after scrolling down
  const getEntries = await getVisibleEntries(page); // grab all product urls
  return getEntries;
}

// grabs urls of all products loaded onto the DOM
async function getVisibleEntries(page) {
  const urlArray = await page.$$eval(`.product-image > a`, elemArray => elemArray.map(elem => elem.getAttribute(`href`)));
  // if (urlArray.length < 80) lazyScroll(page); //would like a way to check to see if the array contains the # of items I'd like to scrape, if not, scroll further
  return urlArray;
}

const scrape = async () => {
  const { page, urlArray } = await getPage();
  const resultArray = [];

  for (const url of urlArray) {
    await page.goto(url, { waitUntil: `domcontentloaded` });
    const data = await page.evaluate(() => {
      const name = document.querySelector(`.pdp-product-name`).innerText;
      const brand = document.querySelector(`.pdp-product-brand`).innerText;
      const desc = document.querySelector(`.pdp-short-description`).innerText;
      const fit = document.querySelector(`.fit`).innerText;
      const dataObj = {
        name,
        brand,
        desc,
        fit,
      };
      return dataObj;
    });
    resultArray.push(data);
    console.log(resultArray);
  }
  // const dataToSave = JSON.stringify(resultArray);
  // await fs.writeFileSync(`./items.json`, dataToSave, `utf8`);
  return resultArray;
};

scrape().then((data) => {
  console.log(`I'm done here's the data if it exists: `, data);
});


// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

// await page.evaluate(() => {
//   const showMoreButton = document.querySelector(`.button secondary`);
//   if (showMoreButton) page.click(`#primary > div.search-result-container > div.loadmore > div > a`);
// });
