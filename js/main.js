function gid(s) {return document.getElementById(s);}

let items, recipes, fuse, results;
let history = [];

const garlondLogoUrl = 'https://www.garlandtools.org/favicon.png';
const garlondItemLinkUrl = 'https://www.garlandtools.org/db/#item/{id}';
const tcLogoUrl = 'https://ffxivteamcraft.com/assets/logo.png';
const tcLinkUrl = 'https://ffxivteamcraft.com/simulator/{id}';
const caasLogoUrl = 'https://ffxivcrafting.com/img/favicon@2x.png';
const caasLinkUrl = 'https://ffxivcrafting.com/crafting/item/{id}?self_sufficient=1';

(async () => {
  items = await (await fetch('csv/items.json?v=5')).json();
  recipes = await (await fetch('csv/recipes.json?v=5')).json();

  items = items.filter(i=>i);
  recipes = recipes.filter(r=>r);
  fuse = new Fuse(items, {keys: ['name'], threshold: 0.2});

  const data = new URLSearchParams(window.location.search);
  gid('name').value = data.get('name') || '';
  gid('showAll').checked = data.get('showAll');
  gid('leveOnly').checked = data.get('leveOnly');
  if (gid('name').value) {
    lookup();
  }
})();

const searchLink = function (s) {
  return `<a href="#" onclick="itemClick('${s.replace(/'/g, '\\\'')}')">${s}</a>`;
}

const linkLeve = function (s, id) {
  let output = `<a target="_blank" href="https://www.garlandtools.org/db/#leve/${id}">${s}</a>`;
  return output;
}

const lookup = function (options = {}) {
  const name = gid('name').value;
  // Direct Recipe lookup
  const recipe = recipes.find(r=>r.name.toLowerCase().startsWith(name.toLowerCase()));
  if (recipe) {
    showRecipe(recipe.itemId);
  }
  results = fuse.search(name);
  if (!gid('leveOnly').checked) {
    results = results.filter(r=>r.recipes.length);
  }
  if (!options.skipHistory && results.length) {
    addHistory(name);
  }
  gid('size').innerHTML = `Found ${results.length} Results`;
  generateTable(results);
}

const addHistory = function (name) {
  if (history.includes(name)) {
    return;
  }
  history.push(name);
  let content = '';
  history.forEach(entry => {
    content = `<div class="historyDiv" onClick="historyClick('${entry}')">&#128257; <span class="historyLink">${entry}</span></div>` + content;
  });
  gid('history').innerHTML = content;
}

const historyClick = function (name) {
  gid('name').value = name;
  lookup({skipHistory: true});
}

const itemClick = function (name) {
  gid('name').value = name;
  lookup();
}

const shopCheck = function (row) {
  if(row.getData().shop) {
    row.getElement().style.color = 'green';
  }
}

const linkIcons = function (id) {
  const garlond = linkIcon({
    id,
    src: garlondLogoUrl,
    link: garlondItemLinkUrl,
    alt: 'View on Garlond Tools',
  });
  const hasRecipe = recipes.some(r => r.itemId === id);
  if (!hasRecipe) {
    return garlond + '<div class="linkIcon"></div><div class="linkIcon"></div>';
  }
  const teamcraft = linkIcon({
    id: id,
    src: tcLogoUrl,
    link: tcLinkUrl,
    alt: 'Craft on TeamCraft',
  });
  const caas = linkIcon({
    id: id,
    src: caasLogoUrl,
    link: caasLinkUrl,
    alt: 'Plan on CaaS',
  });
  return garlond + teamcraft + caas;
}

const linkIcon = function ({ id, link, src, alt }) {
  return `<div class="linkIcon">
            <a href="${link.replace('{id}', id)}" target="_blank">
              <img class="siteIcon" src="${src}" alt="${alt}" />
            </a>
        </div>`;
}

const listIngredients = function (recipe) {
  let output = '';
  Object.keys(recipe.needs).forEach(n=>{
    const i = items.find(i=>i.id === n);
    const theLink = searchLink(i.name);
    const external = linkIcons(i.id);
    output += `<div class="ingredient">${external} <span class="ingredientName">${theLink}</span> [${recipe.needs[n]}]</div>`;
  });
  return output;
}

const recipeFormatter = function (cell, formatterParams, onRendered) {
  const data = cell.getValue();
  const row = cell.getRow().getData();
  cell.getElement().style.wordWrap = 'normal';

  if (data.length > 10 && !gid("showAll").checked && results.length > 1) {
    return `Used in ${data.length} recipes. (<a href="#" onclick="gid('showAll').click();">Reveal</a>)`;
  } else {
    let output = '';
    data.forEach(rid => {
      const r = recipes.find(r=>rid === r.id);
      const item = items.find(i=>i.id === r.itemId);
      const isIngredient = item && item.recipes.length;
      const name = isIngredient ? searchLink(r.name) : r.name;
      const craftIcon = `<span>
        <img class="linkIcon" src="${r.craftIcon}" alt="${r.craftType}" />
      </span>`;
      output += `<div class="recipe" itemId="${r.itemId}" onmouseover="showRecipe(this)">
        ${craftIcon}
        ${linkIcons(r.itemId)}
        <span class='level'>${r.level}</span>
        <span class='created'>${name}</span>
        </div>`;
    });
    return output;
  }
}

const showRecipe = function (element) {
  let itemId;
  if (typeof element === "object") {
    itemId = $(element).attr('itemid');
    $('.recipeHover').removeClass('recipeHover');
    $(element).addClass('recipeHover');
  } else {
    itemId = element;
  }

  const recipeList = recipes.filter(r=>r.itemId === itemId);
  const recipeOutput = recipeList
    .map(r => `<div class="recipeEntry">
          <div class="recipeType">
            <img class="linkIcon" src="${r.craftIcon}" alt="${r.craftType}" /> ${r.craftType}
          </div>
          ${listIngredients(r)}
        </div>`
    )
    .join('');
  gid('recipeDisplay').innerHTML = `<div class="recipeTitle">
    <div class="recipeTitleLeft">
      <img src="${recipeList[0].recipeIcon}" class="recipeIcon" />
    </div>
    <div class="recipeTitleRight">
      <div class="recipeName">${recipeList[0].name}</div>
      <div class="recipeIcons">${linkIcons(itemId)}</div>
    </div>
  </div>
  <div class="recipes">${recipeOutput}</div>`;
}

const leveFormatter = function (cell) {
  const data = cell.getValue();
  let output = '';
  data.forEach(leve => {
      output += `<div class="leve">
        <img class='craftImage' src="${leve.craftIcon}" alt="${leve.craftType}" />
        <span class='level'>${leve.level}</span>
        <span class="created">${linkLeve(leve.name, leve.id)}</span>
        <span class="qty">(qty: ${leve.qty})</span>
      </div>`;
  });
  return output;
}

const nameFormatter = function (cell) {
  const data = cell.getValue();
  const row = cell.getRow().getData();

  const hasRecipe = recipes.some(r => r.itemId === row.id);
  const caas = hasRecipe && linkIcon({
    id: row.id,
    src: caasLogoUrl,
    link: caasLinkUrl,
    alt: 'Plan on CaaS',
    hover: `Plan ${data}`,
  });
  const garlond = linkIcon({
    id: row.id,
    src: garlondLogoUrl,
    link: garlondItemLinkUrl,
    alt: 'View on Garlond Tools',
    hover: `View ${data}`,
  });
  return `${searchLink(data)} <br/>
    ${linkIcons(row.id)}`;
}

const generateTable = function (matched) {
  const height = window.innerHeight 
    - gid('heading').offsetHeight 
    - gid('history').offsetHeight 
    - gid('credits').offsetHeight 
    - 18;
  var table = new Tabulator('#item-table', {
    height,
    rowFormatter:shopCheck,
    selectable: false,
    data:matched, //assign data to table
    layout:'fitData',
    columns:[ //Define Table Columns
      {title:'', field:'icon', formatter:'image', formatterParams: {height:'40px', width:'40px'}},
      {title:'Name (stack)', field:'name', cssClass:'nameCell', formatter:nameFormatter},
      // {title:'Desc', field:'desc'},
      {title:'Can Buy', field:'shop', align:'center', formatter:'tickCross'},
      {title:'Price', field:'price'},
      {title:'Leves', field:'leves', align:'center', formatter:leveFormatter, variableHeight: true},
      {
        title:'Recipes',
        field:'recipes',
        formatter: recipeFormatter,
        cssClass: 'recipeCell',
        variableHeight: true,
      },
    ],
  });
}

setTimeout(() => {
  $('#name').on('keyup', function (e) {
    if (e.keyCode === 13) {
      lookup();
    }
  });
}, 100);

window.onresize = lookup;
