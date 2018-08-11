/* eslint no-restricted-syntax: 0 */
/* eslint-env browser */
/* eslint no-await-in-loop: 0 */

const puppeteer = require(`puppeteer`);

const getData = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`https://www.aritzia.com/us/en/clothing/blouses/blouses-longsleeve`);
  await page.setViewport({ width: 1000, height: 800 });
  await page.waitFor(2000); // waitForNavigation
  const idArray = await page.$$eval(`.product-tile`, elemArray => elemArray.map(elem => elem.getAttribute(`id`)));
  return { page, idArray };
};


const scrape = async () => {
  const { page, idArray } = await getData();

  const theGoodStuff = await idArray.map(async (id) => {
    console.log(`in the promise...`);
    await page.click(`#${id} > div.product-image > a > img`);

    await page.waitFor(2000);

    const result = await page.evaluate(() => {
      console.log(`this is the brand`);

      const brand = document.querySelector(`.pdp-product-brand`).innerText;
      const name = document.querySelector(`.pdp-product-name`).innerText;
      const desc = document.querySelector(`.pdp-short-description`).innerText;
      const fit = document.querySelector(`.fit`).innerText;

      const data = {
        brand,
        name,
        desc,
        fit,
      };
      console.log(`data is ....`);
      console.log(data);
      return data;
    });

    await page.goBack();
    process.nextTick();
    return result;
  });
  return theGoodStuff;
};


scrape().then((data) => {
  console.log(data);
});

// #e83d3fa5015adffc0a615bd22b > div.product-image > a > img

const result = await page.evaluate(() => {
  let foo = Array.from(document.querySelectorAll('.product-tile'))
  let idArray = foo.map(elem => elem.getAttribute("id"))
  return idArray
})

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
