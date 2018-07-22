/* eslint no-restricted-syntax: 0 */
/* eslint-env browser */
/* eslint no-await-in-loop: 0 */
/* eslint-disable no-loop-func */

const puppeteer = require(`puppeteer`);
// Make console messages look nice
const chalk = require(`chalk`);
// const fs = require(`fs`);

const unwantedCartUrl = `https://www.aritzia.com/us/en/cart`;
const scrollDelayDefault = 1000;
const noItemsFoundTimeout = 5000;

// grabs urls of all products loaded onto the DOM
const getVisibleEntries = async page =>
  page.$$eval(`.product-image > a`, elemArray => elemArray.map(elem => elem.getAttribute(`href`)));

async function scrapeInfiniteScrollItems(
  page,
  numberOfItems,
  scrollDelay = scrollDelayDefault,
) {
  let items = [];
  let itemsLength = items.length;
  try {
    /*
    In case there are not enough items that exist that you are looking for
    This code will check to see if no new items are being found and if there are none
    Then it will kill the process and exit with the items that ARE found
    */
    this.interval = setInterval(() => {
      if (items.length !== itemsLength) {
        itemsLength = items.length;
      } else {
        console.info(chalk.red(`No new items were found after the set interval check ran, exiting`));
        process.exit({ items, page, numberOfItems });
      }
    }, noItemsFoundTimeout);

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
  // cmpleted looking for items
  clearInterval(this.interval);
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

const scrapeItems = async ({ page, items, numberOfItems }) => {
  const resultArray = [];
  console.info(chalk.cyan(`Starting scraping for individual items:`));

  for (const url of items) {
    console.info(chalk.green(`Starting scrape for ${url}`));
    await page.goto(url, { waitUntil: `domcontentloaded` });
    const data = await page.evaluate(async () => {
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
      console.log(dataObj);
      return dataObj;
    });
    console.info(chalk.cyan(`Finished scrape for ${url}`));
    resultArray.push(data);
  }

  console.log(chalk.blue(`Finished gather ALL of the data`));
  return resultArray;
};

const scrape = async ({ numberOfItems }) => {
  const { page, items } = await getPage({ numberOfItems });
  console.info(chalk.cyan(`Successfully found ${numberOfItems} items:`));
  console.info(chalk.magenta(items));
  return scrapeItems({ page, items, numberOfItems });
};


scrape({ numberOfItems: 5 }).then((items) => {
  console.info(chalk.magenta(`Success`));
  console.info(chalk.magenta(`There are ${items.length} items:`));
  console.info(chalk.green(JSON.stringify(items)));

  /** ************

  TODO: Save the items here - there is some code below that does this locally but you prob want
  to do this In a DB somewhere
  const dataToSave = JSON.stringify(resultArray);
  await fs.writeFileSync(`./items.json`, dataToSave, `utf8`);

  *************** */
  process.exit();
});

process.on(`exit`, async ({ items = [], page = {}, numberOfItems = 0 }) => {
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
});
