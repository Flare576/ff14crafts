function gid(s) {return document.getElementById(s);}

let items, recipes, fuse;
let history = [];

(async () => {
  items = await (await fetch('csv/items.json?v=4')).json();
  recipes = await (await fetch('csv/recipes.json?v=4')).json();

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

const link = function ({s, id, type = 'item', includeSearch = false}) {
  let output = `<a target="_blank" href="https://www.garlandtools.org/db/#${type}/${id}">${s}</a>`;
  if (includeSearch) {
    output += `<a class="searchLink" onclick="itemClick('${s}');">Search</a>`;
  }
  return output;
}

const lookup = function (options = {}) {
  const name = gid('name').value;
  let results = fuse.search(name);
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

const recipeFormatter = function (cell, formatterParams, onRendered) {
  const data = cell.getValue();
  const row = cell.getRow().getData();
  cell.getElement().style.wordWrap = 'normal';
  if (data.length > 10 && !gid("showAll").checked) {
    return `Used in ${data.length} recipes. (<a href="#" onclick="gid('showAll').click();">Reveal</a>)`;
  } else {
    let output = '';
    data.forEach(rid => {
      const r = recipes.find(r=>rid === r.id);
      const theLink = link({s: r.name, id: r.itemId, type:'item', includeSearch: true});
      const craftUrl = `https://ffxivteamcraft.com/simulator/${r.itemId}`;
      const planUrl = `https://ffxivcrafting.com/item/${r.itemId}`;
      output += `<div class="recipe">
        <img class="recipeIcon" src="${r.craftIcon}" alt="${r.craftType}" />
        <div class="linkIcon">
          <a href="${craftUrl}" target="_blank">
            <img class="recipeIcon" src="https://ffxivteamcraft.com/assets/logo.png" alt="${r.craftType}" />
          </a>
          <span>Craft ${r.name}</span>
        </div>
        <div class="linkIcon">
          <a href="${planUrl}" target="_blank">
            <img class="recipeIcon" src="https://ffxivcrafting.com/img/favicon@2x.png" alt="${r.craftType}" />
          </a>
          <span>Plan ${r.name}</span>
        </div>
        <span class='level'>${r.level}</span>
        <span class="created">${theLink}</span> (`;

      Object.keys(r.needs).forEach(n=>{
        const i = items.find(i=>i.id === n);
        const theLink = link({s: i.name, id: i.itemId, type:'item', includeSearch: i.id >= 100});
        output += `<span class=ingredient>${theLink} [${r.needs[n]}]</span>`;
      });
      output += ')</div>';
    });
    return output;
  }
}

const leveFormatter = function (cell) {
  const data = cell.getValue();
  let output = '';
  data.forEach(leve => {
      output += `<div class="leve">
        <img class='craftImage' src="${leve.craftIcon}" alt="${leve.craftType}" />
        <span class='level'>${leve.level}</span>
        <span class="created">${link({s: leve.name, id: leve.id, type: 'leve'})}</span>
        <span class="qty">(qty: ${leve.qty})</span>
      </div>`;
  });
  return output;
}

const nameFormatter = function (cell) {
  const data = cell.getValue();
  const row = cell.getRow().getData();
  return `${link({s: data, id: row.id, type: 'item'})} <span class="stack-size">(${row.stack})</span><br/>
    <a class="filterLink" href="#" onclick="itemClick('${data}')">Filter</a>`;
}

const generateTable = function (matched) {
  const height = window.innerHeight - gid('heading').offsetHeight - gid('credits').offsetHeight - 18;
  var table = new Tabulator('#item-table', {
    height,
    rowFormatter:shopCheck,
    selectable: false,
    data:matched, //assign data to table
    layout:'fitData', //fit columns to width of table (optional)
    columns:[ //Define Table Columns
      {title:'', field:'icon', formatter:'image', formatterParams: {height:'40px', width:'40px'}},
      {title:'Name (stack)', field:'name', width:150, cssClass:'testing', formatter:nameFormatter},
      // {title:'Desc', field:'desc'},
      {title:'Can Buy', field:'shop', align:'center', formatter:'tickCross'},
      {title:'Price', field:'price'},
      {title:'Leves', field:'leves', align:'center', formatter:leveFormatter, variableHeight: true},
      {
        title:'Recipes',
        field:'recipes',
        formatter: recipeFormatter,
        variableHeight: true
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
