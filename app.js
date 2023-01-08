const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
const _ = require("Lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("mongodb://0.0.0.0:27017/listDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const item = new mongoose.model('item', itemsSchema)

const item1 = new item({
  name: "Welcome to the To Do List!"
});
const item2 = new item({
  name: "Hit the + button to add a new item"
});
const item3 = new item({
  name: "<-- Click here to delete a item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = new mongoose.model('List', listSchema);

var today = new Date();
var options = {
  weekday: "long",
  day: "numeric",
  month: "long"
}
var day = today.toLocaleDateString("en-US", options);

app.get("/", function(req, res) {

  item.find({}, function(err, foundItems) {
    if (foundItems.length == 0) {
      item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", {
        typeOfDay: day,
        newItem: foundItems
      });

    }
  })

});

app.get("/:customListName", function(req, res) {
  const customName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customName);
      } else {
        res.render("list", {
          typeOfDay: foundList.name,
          newItem: foundList.items
        });
      }
    }
  })

})

app.post("/", function(req, res) {

  var itemName = req.body.newInput;
  var listName = req.body.button;
  const newItem = new item({
    name: itemName
  })

  if (listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundItem) {
      foundItem.items.push(newItem);
      foundItem.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listNamedel = req.body.listName;

  if (listNamedel === day){
    item.findByIdAndRemove(checkedItem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Success");
      }
      res.redirect("/");
  })}else{
    List.findOneAndUpdate({name: listNamedel}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listNamedel);
      }
    })
  }
})

app.listen(3000, function() {
  console.log("Server has started.");
});
