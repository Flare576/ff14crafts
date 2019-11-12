#!/bin/sh
":" //;NODE_PATH=$(npm -g root) exec node -r ${FLARE_SCRIPTS}/js/sideLoad.js "$0" "$@"
  const usage = `Pulls the latest CSVs from xivapi/xiv-datamining and converts to formated data`;
const argv = require('yargs')
  .usage(usage)
  .alias('help', 'h')
.argv;
const Papa = require('papaparse');
const fs = require('fs');
const fetch = require('node-fetch');
let items, recipes, shop, info, info_items;
const craftIcon = [
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/carpenter.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/blacksmith.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/armorer.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/goldsmith.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/leatherworker.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/weaver.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/alchemist.png',
  'https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/culinarian.png',
];
const craftType = [
  'Woodworking',
  'Smithing',
  'Armorcraft',
  'Goldsmithing',
  'Leatherworking',
  'Clothcraft',
  'Alchemy',
  'Cooking',
];

(async () => {
  items = await pp('Item.csv');
  recipes = (await pp('Recipe.csv'))
    .filter(r=>r['Item{Result}'] && r['Item{Result}'] !== '0');
  shop = await pp('GilShopInfo.csv');
  info_items = [];
  info = recipes
    .map((r,i) => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Processing ${pad(i)} of ${recipes.length}`);

      const needs = cross(r);
      return {
        id: r['#'],
        name: items.find(i=>r['Item{Result}']===i['#']).Name,
        qty: r['Amount{Result}'],
        level: r.RecipeLevelTable,
        craftType: craftType[r.CraftType],
        craftIcon: craftIcon[r.CraftType],
        needs,
      };
    });
  console.log('\nWriting table data...');

  await fs.writeFileSync('recipes.json', JSON.stringify(info));
  await fs.writeFileSync('items.json', JSON.stringify(info_items));
})();

async function pp (f) {
  console.log(`Downloading ${f}`);
  const path = `https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/${f}`;
  const result = await fetch(path);
  const content = await result.text();
  const lines = content.split('\n');
  // first line is numeric headers
  // second line is named headers
  // third  line is data types
  // fourth line is ... defaults maybe?
  // blank header names suck
  let headers = lines[1];
  let instance = 1;
  while (true) {
    const idx = headers.indexOf(',,');
    if (idx < 0) break;
    headers = headers.replace(',,',`,flare${instance},`);
    instance++;
  }
  if (headers.charAt(headers.length-1) === ',') {
    headers += `flare${instance}`;
  }

  const dataWithHeaders = lines.slice(4);
  dataWithHeaders.unshift(headers);

  return Papa.parse(dataWithHeaders.join('\n'), {header:true}).data;
}

function cross (r) {
  let needs = {};
  for(let x=0;x<9;x++) {
    const pid = r[`Item{Ingredient}[${x}]`];
    if (pid && pid !== '0') {
      const i = items.find(i=>i['#']===pid);
      const inShop = !!shop.find(s=>s['#']==pid && s.flare1 > 0);
      needs[pid] = r[`Amount{Ingredient}[${x}]`];
      if (!info_items[pid]) {
        info_items[pid] = {
          id: pid,
          name: i.Name,
          icon: pic(i.Icon),
          desc: clean(i.Description),
          level: i['Level{Item}'],
          rarity: i.Rarity,
          stack: i.StackSize,
          shop: inShop,
          price: inShop ? `Buy: ${i['Price{Mid}']}` : `Sell: ${i['Price{Low}']}`,
          recipes:[],
        };
      }
      info_items[pid].recipes.push(r['#']);
    }
  }
  return needs;
};

function clean (s) {
  while (true) {
    const start = s.indexOf('<');
    const end = s.indexOf('>');
    if (start === -1 || end === -1) {
      break;
    }
    s = s.substring(0, start) + s.substring(end+1);
  }
  return s;
}
// https://raw.githubusercontent.com/xivapi/classjob-icons/master/icons/alchemist.png
function pic (id) {
  id = pad(id)
  const folder = `${id.substr(0,3)}000`;
  return `https://xivapi.com/i/${folder}/${id}.png`;
}

function pad (id) {
  while (id.length < 6) {
    id = `0${id}`;
  }
  return id;
}



// vim: ft=javascript
