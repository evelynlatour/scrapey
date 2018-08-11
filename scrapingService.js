/* eslint no-restricted-syntax: 0 */
/* eslint-env browser */
/* eslint no-await-in-loop: 0 */
/* eslint-disable no-loop-func */

const puppeteer = require(`puppeteer`);
// Make console messages look nice
const chalk = require(`chalk`);


const unwantedCartUrl = `https://www.aritzia.com/us/en/cart`;
const scrollDelay = 1000;
const noItemsFoundTimeout = 5000;

// grabs urls of all products loaded onto the DOM
const getVisibleEntries = async page =>
  page.$$eval(`.product-image > a`, elemArray => elemArray.map(elem => elem.getAttribute(`href`)));

async function scrapeInfiniteScrollItems(page, numberOfItems) {
  let items = [];
  let itemsLength = items.length;
  /*
  In case there are not enough items that exist that you specified to find, setInterval
  checks to see if array is being updated/changed every 5 seconds. If not, will kill process.
  (does NOT currently exit with the items that ARE found)
  */
  const interval = setInterval(() => {
    if (items.length !== itemsLength) {
      itemsLength = items.length;
    } else {
      console.info(chalk.red(`No new items were found after the set interval check ran, exiting`));
      process.exit({ items, page, numberOfItems });
    }
  }, noItemsFoundTimeout);

  try {
    while (items.length < numberOfItems) {
      console.log(chalk.magenta(`Searching for items...`));
      items = await getVisibleEntries(page);
      // make the page go to the bottom
      await page.evaluate(() => {
        const lastLi = document.querySelector(`ul.search-result-items > li:last-child`);
        if (lastLi) {
          lastLi.scrollIntoView(false, { behavior: `smooth` });
        }
      });
      // wait for 1 second to fool the webisite so it has a chance to load
      await page.waitFor(scrollDelay);

      // make the page go to the top
      await page.evaluate(`window.scrollTo(0,0)`);
    }
  } catch (e) {
    // If there was an error it will be logged out here
    console.info(chalk.red(`Error getting item urls: ${e}`));
  }

  // Remove the interval so that it does not accidentally fire once we have
  // completed looking for items
  clearInterval(interval);
  return items
    .filter(item => item !== unwantedCartUrl)
    .slice(0, numberOfItems);
}

const getPage = async ({ numberOfItems }) => {
  const browser = await puppeteer.launch({ headless: false, timeout: 0 });
  const page = await browser.newPage();
  await page.goto(`https://www.aritzia.com/us/en/clothing/blouses/blouses-longsleeve`, { waitUntil: `domcontentloaded` });
  await page.setViewport({ width: 1000, height: 800 });
  const items = await scrapeInfiniteScrollItems(page, numberOfItems);
  return { page, items };
};

const scrapeItems = async ({ page, items }) => {
  const resultArray = [];
  console.info(chalk.cyan(`Starting scraping for individual items:`));

  for (const url of items) {
    console.info(chalk.green(`Starting scrape for ${url}`));
    await page.goto(url, { waitUntil: `domcontentloaded` });
    const data = await page.evaluate(async () => {
      const brand = (document.querySelector(`.pdp-product-brand`) || {}).innerText;
      const name = (document.querySelector(`.pdp-product-name`) || {}).innerText;
      const desc = document.querySelector(`.pdp-short-description`).innerText.replace(/(\r\n\t|\n|\r\t)/gm, ``);
      const notes = document.querySelector(`#pdp-designer-notes > .pdp-tab-content`).innerText.replace(/(\r\n\t|\n|\r\t)/gm, ``);
      const fit = document.querySelector(`.fit`).innerText;
      const allImageURLs = Array.from(document.querySelectorAll(`.pdp-image`)).map(({ href }) => href);
      const imageURLs = allImageURLs.map((href, idx) => ((idx === 0 || idx === allImageURLs.length - 1) ? href : null)).filter(item => !!item);
      const colors = Array.from(document.querySelectorAll(`.swatchanchor`)).map(({ title }) => title); // .map(item => item.title)
      const features = Array.from(document.querySelector(`.pdp-tab-content > ul`).getElementsByTagName(`li`)).map(item => item.innerText); // NEED TO SELECT THE CHILD

      return {
        brand,
        name,
        desc,
        fit,
        notes,
        colors,
        features,
        imageURLs,
      };
      return dataObj;
    });
    console.info(chalk.cyan(`Finished scrape for ${url}`));
    resultArray.push(data);
  }

  console.log(chalk.blue(`Finished gathering ALL of the data`));
  return resultArray;
};

const scrape = async ({ numberOfItems }) => {
  const { page, items } = await getPage({ numberOfItems });
  console.info(chalk.cyan(`Successfully found ${numberOfItems} items:`));
  console.info(chalk.magenta(items));
  return scrapeItems({ page, items, numberOfItems });
};

module.exports = scrape;

// process.on(`exit`, async ({ items = [], page = {}, numberOfItems = 0 }) => {
// console.info(chalk.red(`Process completed or timed out after not enough items being found...`));
// console.info(chalk.red(`Requested ${numberOfItems} but only found ${items.length} items`));
// if (items.length > 0) {
/** ************
    TODO: There were not enough items found matching the number of items that the user requested
    BUT we did find at least SOME items. In this case we want to still save these items, do that
    here

    TODO: You will need to potentially exec a child process to finish saving this, check out
    http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn

    console.info(chalk.green(`Now processing ${items.length} found items`));
    const itemsData = await scrapeItems({ page, items, numberOfItems});
    console.info(itemsData);

    *************** */
// }
// });
