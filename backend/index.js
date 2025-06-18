const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const PORT= process.env.PORT || 5000;
// const app = express();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/stores", require("./routes/store"));
app.use("/api/ratings", require("./routes/rating"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/owner", require("./routes/owner"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
