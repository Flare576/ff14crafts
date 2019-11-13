function gid(s) {return document.getElementById(s);}

let items, recipes, fuse;

(async () => {
  items = await (await fetch('csv/items.json?v=1')).json();
  recipes = await (await fetch('csv/recipes.json?v=1')).json();

  items = items.filter(i=>i);
  recipes = recipes.filter(r=>r);
  fuse = new Fuse(items, {keys: ['name'], threshold: 0.2});
})();

const lookup = function () {
  const name = gid('name').value;
  let results = fuse.search(name);
  if (!gid('leveOnly').checked) {
    results = results.filter(r=>r.recipes.length);
  }
  gid('size').innerHTML = `Found ${results.length} Results`;
  generateTable(results);
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
    return `Used in ${data.length} recipes.`;
  } else {
    let output = '';
    data.forEach(rid => {
      const r = recipes.find(r=>rid === r.id);
      output += `<div class="recipe">
        <img class='craftImage' src="${r.craftIcon}" alt="${r.craftType}" />
        <span class='level'>${r.level}</span>
        <span class="created">${r.name}</span> (`;

      Object.keys(r.needs).forEach(n=>{
        const i = items.find(i=>i.id === n);
        output += `<span class=ingredient>${i.name} [${r.needs[n]}]</span>`;
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
        <span class="created">${leve.name}</span>
        <span class="qty">(qty: ${leve.qty})</span>
      </div>`;
  });
  return output;
}

const nameFormatter = function (cell) {
  const data = cell.getValue();
  const row = cell.getRow().getData();
  return `${data} <span class="stack-size">(${row.stack})</span>`;
}

const generateTable = function (matched) {
  const height = window.innerHeight - gid('heading').offsetHeight - gid('credits').offsetHeight - 18;
  var table = new Tabulator('#item-table', {
    height,
    rowFormatter:shopCheck,
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
