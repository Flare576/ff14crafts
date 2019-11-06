function gid(s) {return document.getElementById(s);}

let items, recipes, fuse;

(async () => {
  items = await (await fetch('csv/items.json')).json();
  recipes = await (await fetch('csv/recipes.json')).json();

  items = items.filter(i=>i);
  recipes = recipes.filter(r=>r);
  fuse = new Fuse(items, {keys: ['name'], threshold: 0.2});
})();

const lookup = function () {
  const name = gid('name').value;
  generateTable(fuse.search(name));
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
  if (data.length > 10) {
    return "More than 10 Recipes...";
  } else {
    let output = '';
    data.forEach(rid => {
      const r = recipes.find(r=>rid === r.id);
      const qty = r.needs[row.id];
      output += `<div>${r.name} (${qty})</div>`
      // output += output ? ', ' : '';
      // output += `${r.name} (${qty})`;
    });
    return output;
  }
}

const generateTable = function (matched) {
  var table = new Tabulator("#item-table", {
    rowFormatter:shopCheck,
    data:matched, //assign data to table
    layout:"fitData", //fit columns to width of table (optional)
    columns:[ //Define Table Columns
      {title:"Name", field:"name", width:150},
      // {title:"Desc", field:"desc"},
      {title:"Shop", field:"shop"},
      {title:"Price", field:"price"},
      {title:"Stack", field:"stack"},
      {
        width: 500,
        title:"Recipes",
        field:"recipes",
        formatter: recipeFormatter,
        variableHeight: true
      },
    ],
  });
}

setTimeout(() => {
  $("#name").on('keyup', function (e) {
    if (e.keyCode === 13) {
      lookup();
    }
  });
}, 100);
