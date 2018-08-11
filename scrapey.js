const chalk = require(`chalk`);
const scrape = require(`./scrapingService`);
const fs = require(`fs`);

const displayData = async () => {
  const items = await scrape({ numberOfItems: 5 });
  console.info(chalk.magenta(`Success`));
  console.info(chalk.magenta(`There are ${items.length} items:`));
  console.info(chalk.green(JSON.stringify(items)));

  /** ************
  TODO: Save the items here - there is some code below that does this locally but you prob want
  to do this In a DB somewhere
  *************** */

  const dataToSave = JSON.stringify(items);
  await fs.writeFileSync(`./aritziaItems.json`, dataToSave, `utf8`);


  process.exit();
};


displayData();
