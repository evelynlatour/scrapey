const puppeteer = require(`puppeteer`);

const scrape = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`https://www.aritzia.com/us/en/clothing/blouses/blouses-longsleeve`);
  await page.setViewport({ width: 1000, height: 800 });
  await page.waitFor(2000); // waitForNavigation
  // Scrape
  await page.click(`#bb067cddfb5a966a2f3c40ef9b > div.product-image > a:nth-child(1) > img`);

  await page.waitFor(2000);

  const result = await page.evaluate(() => {
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
  });
  browser.close();
  return result;
};

scrape().then((value) => {
  console.log(value);
});
