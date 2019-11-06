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
    return `Used in ${data.length} recipes.`;
  } else {
    let output = '';
    data.forEach(rid => {
      const r = recipes.find(r=>rid === r.id);
      output += `<div class="recipe"><img class='craftImage' src="${r.craftIcon}" alt="${r.craftType}" />l${r.level} (`;

      Object.keys(r.needs).forEach(n=>{
        const i = items.find(i=>i.id === n);
        output += `<span class=ingredient>${i.name} [${r.needs[n]}]</span>`;
      });
      output += ')</div>';
    });
    return output;
  }
}

const generateTable = function (matched) {
  var table = new Tabulator('#item-table', {
    rowFormatter:shopCheck,
    data:matched, //assign data to table
    layout:'fitData', //fit columns to width of table (optional)
    columns:[ //Define Table Columns
      {title:'', field:'icon', formatter:'image', formatterParams: {height:'40px', width:'40px'}},
      {title:'Name', field:'name', width:150, cssClass:'testing'},
      // {title:'Desc', field:'desc'},
      {title:'Can Buy', field:'shop', align:'center', formatter:'tickCross'},
      {title:'Price', field:'price'},
      {title:'Stack', field:'stack'},
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
