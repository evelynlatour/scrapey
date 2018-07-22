/* eslint no-restricted-syntax: 0 */
/* eslint-env browser */
/* eslint no-await-in-loop: 0 */

const puppeteer = require(`puppeteer`);

const getData = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://www.aritzia.com/us/en/clothing/blouses/blouses-longsleeve`, { waitUntil: `domcontentloaded` });
  await page.setViewport({ width: 1000, height: 800 });
  // Grab the individual URLs & put into an array
  const urlArray = await page.$$eval(`.product-image > a`, elemArray => elemArray.map(elem => elem.getAttribute(`href`)));
  return { page, urlArray };
};

const scrape = async () => {
  const { page, urlArray } = await getData();

  for (const url of urlArray) {
    const resultArray = [];
    await page.goto(url, { waitUntil: `domcontentloaded` });

    const data = await page.evaluate(() => {
      const brand = document.querySelector(`.pdp-product-brand`).innerText;
      const name = document.querySelector(`.pdp-product-name`).innerText;
      const dataObj = {
        brand,
        name,
      };
      return dataObj;
    });
    console.log(`Data logged inside FOR loop: ${data}`);
    // fs.writeFileSync('./items.txt', items.join('\n') + '\n');
    // since you have a list of URLs you actually don't need to go back after each...
    await page.goBack();
  }
  // after loop is done, need to scroll down page & get next set of URLs
};

scrape().then((data) => {
  console.log(data);
});


// #e83d3fa5015adffc0a615bd22b > div.product-image > a > img
// #\39 51f90c571ed03c5d2475779fc > div.product-image > a > img
// #bb067cddfb5a966a2f3c40ef9b > div.product-image > a:nth-child(1) > img
//
// #b35d5b0d8955414f2a7a91eae0 > div.product-image > a > img
// #\32 dc4a6a6f9f8065788fab91aa1 > div.product-image > a > img
// #\34 e8d326932d5950589718386e5 > div.product-image > a:nth-child(1) > img

// const result = await page.evaluate(() => {
//   let foo = Array.from(document.querySelectorAll('.product-tile'))
//   let idArray = foo.map(elem => elem.getAttribute("id"))
//   return idArray
// })

// page.click(`#${idArray[0]} > div.product-image > a > img`)
// await page.waitFor(2000)
// const result = await page.evaluate(() => {
//   let brand = document.querySelector('.pdp-product-brand').innerText
//   let name = document.querySelector('.pdp-product-name').innerText
//   let desc = document.querySelector('.pdp-short-description').innerText
//   let fit = document.querySelector('.fit').innerText
//
//   return {
//     brand,
//     name,
//     desc,
//     fit,
//   }
// })
