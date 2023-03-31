const jsonServer = require("json-server");
const bodyParser = require("body-parser");
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const ejs = require("ejs");
const htmlToText = require("html-to-text");
const juice = require("juice"); 
const fs = require("fs");

const app = express();
const router = express.Router();

const server = jsonServer.create();
const jsonRouter = jsonServer.router("db.json");
const middleware = jsonServer.defaults();

const db = jsonRouter.db;

server.use(middleware);
server.use(bodyParser.json());
app.use(bodyParser.json());
app.use(cors()); 

server.use("/users/sign-in", (req, res) => {
  const { email, password } = req.body;

  // Find user with matching email and password
  const user = db
    .get("users")
    .find((user) => user.email === email && user.password === password)
    .value();

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  // Send success response with user information
  res.status(200).json({ message: "User logged in successfully", user });
});

server.post("/users/sign-up", (req, res) => { 
  const { email, password, username, address } = req.body;

  // Check if user already exists
  const userExists = db
    .get("users")
    .some((user) => user.email === email)
    .value();
  console.log(userExists);
  if (userExists) {
    return res.status(409).send("User already exists");
  }

  // Create new user object
  const newUser = {
    id: Date.now(),
    username,
    email,
    password,
    address,
    createdAt: Date.now(),
  };

  // Add new user to database
  db.get("users").push(newUser).write();

  // Send success response
  res.status(201).json({ message: "User created successfully", user: newUser });
});

router.post("/orders", async (req, res) => {
  const { email = "", items =[], total = 0 } = req.body;

  // Create email message
  

  const message = `New order received from ${email}\n\nItems:\n${items}\n\nTotal: $${total}`;

  const html = await fs.promises.readFile(`${__dirname}/views/orders.ejs`, "utf-8")

  const renderToHtml = ejs.render(html, {products: items, total})

  const inlinedHtml = await juice(renderToHtml)

  const text = htmlToText.htmlToText(inlinedHtml);

  // Set up email transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "vantuanxyz741@gmail.com",
      pass: "nwbnefghrswejlke",
    },
  });

  // Set up email options
  const mailOptions = {
    from: "vantuanxyz741@gmail.com",
    to: 'manhoang86021@gmail.com',
    subject: "New Order",
    text: text,
    html: inlinedHtml
  };

  // Send email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Email sent successfully");
    }
  });
});

app.use(router);
server.use(jsonRouter);

server.listen(4000, () => {
  console.log("Json server listening on port 5000");
})

app.listen(5000, () => {
  console.log("listening on port 4000");
}); 
