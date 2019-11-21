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
let items, recipes, shop, info, infoItems, leveItems;
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
  infoItems = [];
  leveItems = [];
  items = await pp('Item.csv');
  recipes = (await pp('Recipe.csv'))
    .filter(r=>r['Item{Result}'] && r['Item{Result}'] !== '0');
  shop = await pp('GilShopInfo.csv', '#,inShop');
  await prepLeves();
  info = recipes
    .map((r,i) => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Processing Recipe ${i+1} of ${recipes.length}`);

      const needs = cross(r);
      return {
        id: r['#'],
        itemId: r['Item{Result}'],
        name: items.find(i=>r['Item{Result}']===i['#']).Name,
        qty: r['Amount{Result}'],
        level: r.RecipeLevelTable,
        craftType: craftType[r.CraftType],
        craftIcon: craftIcon[r.CraftType],
        needs,
      };
    });
  console.log('');

  console.log('Writing table data...');

  await fs.writeFileSync('recipes.json', JSON.stringify(info));
  await fs.writeFileSync('items.json', JSON.stringify(infoItems));
})();

async function prepLeves() {
  const allLeves = await pp('Leve.csv');
  const leveTypes = await pp('LeveAssignmentType.csv');
  const craftLeves = await pp('CraftLeve.csv');
  craftLeves.forEach((l,i) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Processing Leve ${i+1} of ${craftLeves.length}`);
    for(let x=0;x<4;x++) {
      const iId = l[`Item[${x}]`];
      if (!iId || iId === '0') {
        continue;
      }
      let item = getOrAddItem(iId);
      // Non-stacking objects are listed multiple times
      const existing = item.leves.find(il=>il.id===l.Leve);
      if (existing) {
        existing.qty++;
      } else {
        const leve = allLeves.find(al=>al['#']===l.Leve);
        const leveType = leveTypes.find(lt=>lt['#']===leve.LeveAssignmentType);
        item.leves.push({
          id: l.Leve,
          level: leve.ClassJobLevel,
          craftType: leveType.Name,
          craftIcon: pic(leveType.Icon),
          qty: l[`ItemCount[${x}]`],
          name: leve.Name,
        });
      }
    }
  });
  console.log('');
};

async function pp (f, headers) {
  console.log(`Downloading ${f}`);
  const path = `https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/${f}`;
  const result = await fetch(path);
  const content = await result.text();
  const lines = content.split('\n');
  // first line is numeric headers
  // second line is named headers
  // third  line is data types
  // fourth line is ... defaults maybe?
  headers = headers || lines[1];

  const dataWithHeaders = lines.slice(4);
  dataWithHeaders.unshift(headers);

  return Papa.parse(dataWithHeaders.join('\n'), {header:true}).data;
}

function cross (r) {
  let needs = {};
  for(let x=0;x<9;x++) {
    const pid = r[`Item{Ingredient}[${x}]`];
    if (pid && pid !== '0') {
      item = getOrAddItem(pid);
      needs[pid] = r[`Amount{Ingredient}[${x}]`];
      item.recipes.push(r['#']);
    }
  }
  return needs;
};

function getOrAddItem (pid) {
  let item = infoItems.find(i=>i.id === pid);
  if (!item) {
    const i = items.find(i=>i['#']===pid);
    if(!i) {
      console.log('wtf', pid);
    }
    const inShop = !!shop.find(s=>s['#']==pid && s.inShop > 0);
    const inLeves = !!leveItems.find(i=>i.id==pid);
    item = {
      id: pid,
      name: i.Name,
      icon: pic(i.Icon),
      desc: clean(i.Description),
      level: i['Level{Item}'],
      rarity: i.Rarity,
      stack: i.StackSize,
      shop: inShop,
      price: inShop ? `Buy: ${i['Price{Mid}']}` : `Sell: ${i['Price{Low}']}`,
      leves: [],
      recipes:[],
    };
    infoItems.push(item);
  }
  return item;
}

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
