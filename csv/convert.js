#!/bin/sh
":" //;NODE_PATH=$(npm -g root) exec node -r ${FLARE_SCRIPTS}/js/sideLoad.js "$0" "$@"
  const usage = `Pulls the latest CSVs from xivapi/xiv-datamining and converts to formated data`;
const argv = require('yargs')
  .usage(usage)
  .alias('help', 'h')
.argv;
const Papa = require('papaparse');
const fs = require('fs');
let items, recipes, shop, info, info_items;
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
  // Can't just grab remote files; need to remove 1st and 3rd (or more) rows
  items = await pp('orig_Item.csv');
  recipes = await pp('orig_Recipe.csv');
  shop = await pp('orig_GilShopInfo.csv');
  info_items = [];
  info = recipes
    .filter(r=>r['Item{Result}'] && r['Item{Result}'] !== '0')
    .map(r=>{
      const needs = cross(r);
      return {
        id: r['#'],
        name: items.find(i=>r['Item{Result}']===i['#']).Name,
        qty: r['Amount{Result}'],
        level: r.RecipeLevelTable,
        craftType: craftType[r.CraftType],
        needs,
      };
    });

  await fs.writeFileSync('recipes.json', JSON.stringify(info));
  await fs.writeFileSync('items.json', JSON.stringify(info_items));
})();

async function pp (f) {
  return new Promise(r => Papa.parse((fs.createReadStream(f)), {header:true,complete:d=>r(d.data)}));
}
function cross (r) {
  let needs = {};
  for(let x=0;x<9;x++) {
    const pid = r[`Item{Ingredient}[${x}]`];
    if (pid && pid !== '0') {
      const i = items.find(i=>i['#']===pid);
      const inShop = !!shop.find(s=>s.key==pid && s.sold > 0);
      needs[pid] = r[`Amount{Ingredient}[${x}]`];
      if (!info_items[pid]) {
        info_items[pid] = {
          id: pid,
          name: i.Name,
          desc: clean(i.Description),
          icon: i.Icon,
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


// vim: ft=javascript
