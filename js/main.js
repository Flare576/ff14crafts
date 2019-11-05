function gid(s) {return document.getElementById(s);}

let items, recipes, fuse;

(async () => {
  items = await (await fetch('../csv/items.json')).json();
  recipes = await (await fetch('../csv/recipes.json')).json();

  items = items.filter(i=>i);
  recipes = recipes.filter(r=>r);
  fuse = new Fuse(items, {keys: ['name'], threshold: 0.2});
})();

const lookup = function () {
  const name = gid('name').value;
  generateTable(fuse.search(name));

  console.log(`looking up ${name}`, matching);
}

const generateTable = function (matched) {
  var table = new Tabulator("#item-table", {
    height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    data:matched, //assign data to table
    layout:"fitColumns", //fit columns to width of table (optional)
    columns:[ //Define Table Columns
      {title:"Name", field:"name", width:150},
      {title:"Desc", field:"desc"},
      {title:"Shop", field:"shop"},
      {title:"Stack", field:"stac"},
      {title:"Recipes", field:"dob"},
    ],
    rowClick:function(e, row){ //trigger an alert message when the row is clicked
      alert("Row " + row.getData().id + " Clicked!!!!");
    },
  });
}
