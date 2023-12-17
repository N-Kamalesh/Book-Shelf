//Importing all required packages
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import "dotenv/config";

//Creating necessary variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
let books = [];
let sort = "id";
let order = "DESC";
let errorMsg = "";

//Connecting to the database
const db = new pg.Client({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: true,
});
await db.connect();

//Using necessary middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Function to get the book list from the database
async function getBooks() {
  try {
    console.log(sort);
    const response = await db.query(
      `SELECT * FROM book_list ORDER BY ${sort} ${order}`
    );
    errorMsg = "";
    books = response.rows;
  } catch (error) {
    console.log(error);
  }
}

//Home page
app.get("/", async (req, res) => {
  await getBooks();
  res.render(path.join(__dirname, "views/index.ejs"), { books });
});

//Sorting the book list based on the user's option
app.post("/sort", (req, res) => {
  const waytoSort = req.body.sort;
  switch (waytoSort) {
    case "id":
      sort = "id";
      order = "DESC";
      break;
    case "updated_time":
      sort = "updated_time";
      order = "DESC";
      break;
    case "name":
      sort = "name";
      order = "ASC";
      break;
    case "rating":
      sort = "rating";
      order = "DESC";
      break;
    default:
      sort = "id";
      order = "DESC";
  }
  res.redirect("/");
});

//Page to add new book
app.get("/new", async (req, res) => {
  res.render(path.join(__dirname, "views/new.ejs"), { error: errorMsg });
});

//Page to edit an exisiting book
app.get("/edit/:id", async (req, res) => {
  const editId = parseInt(req.params.id);
  try {
    const bookToEdit = books.find((book) => book.id === editId);
    console.log(bookToEdit.id);
    res.render(path.join(__dirname, "views/new.ejs"), {
      book: bookToEdit,
      error: errorMsg,
    });
  } catch (error) {
    console.log(error);
  }
});

//Page that shows full notes of the book
app.get("/book/:id", async (req, res) => {
  const bookId = parseInt(req.params.id);
  try {
    const reqBook = books.find((book) => book.id === bookId);
    console.log(reqBook.id);
    console.log(reqBook.name);
    res.render(path.join(__dirname, "views/book.ejs"), { book: reqBook });
  } catch (error) {
    console.log(error);
  }
});

//Delete a book from the database
app.get(`/delete/:id`, async (req, res) => {
  const id = req.params.id;
  try {
    await db.query("DELETE FROM book_list WHERE id = $1", [id]);
  } catch (error) {
    console.log(error);
  } finally {
    res.redirect("/");
  }
});

//Add a new book to the database
app.post("/add", async (req, res) => {
  const name = req.body.name.trim();
  const author = req.body.author.trim();
  const note = req.body.note.trim();
  const isbn = req.body.isbn.trim();
  const updatedTime = new Date();
  const rating = parseFloat(req.body.rating);
  if (name && author && note && isbn && rating) {
    try {
      await db.query(
        "INSERT INTO book_list (name, author, isbn, rating, note, updated_time) VALUES ($1, $2, $3, $4, $5, $6)",
        [name, author, isbn, rating, note, updatedTime]
      );
    } catch (error) {
      console.log(error);
    } finally {
      errorMsg = "";
      res.redirect("/");
    }
  } else {
    errorMsg = "Please fill all the fields!";
    res.redirect("/new");
  }
});

//Update a book in the database
app.post("/update", async (req, res) => {
  const name = req.body.name.trim();
  const id = parseInt(req.body.id);
  const author = req.body.author.trim();
  const note = req.body.note.trim();
  const isbn = req.body.isbn.trim();
  const updatedTime = new Date();
  const rating = parseFloat(req.body.rating);
  if (name && author && note && isbn && rating) {
    try {
      await db.query(
        "UPDATE book_list SET name = $1, author = $2, note = $3, isbn = $4, rating = $5, updated_time = $6 WHERE id = $7",
        [name, author, note, isbn, rating, updatedTime, id]
      );
    } catch (error) {
      console.log(error);
    } finally {
      errorMsg = "";
      res.redirect("/");
    }
  } else {
    const error = "Please fill all the fields!";
    res.redirect(`"/edit/${id}`);
  }
});

//Setting up server to listen on the specified port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
