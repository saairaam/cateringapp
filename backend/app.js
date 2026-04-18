const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Allow same-origin (Netlify) and local dev on any Vite port (5173–5179)
const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:5174",
	"http://localhost:5175",
	"http://localhost:5176",
	"http://127.0.0.1:5173",
	"http://127.0.0.1:5174",
	"https://amrutham-management.netlify.app",
	process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (same-domain Netlify Functions, curl, etc.)
			if (!origin || allowedOrigins.includes(origin))
				return callback(null, true);
			callback(new Error("CORS blocked: " + origin));
		},
		credentials: true,
		optionsSuccessStatus: 200,
	}),
);
app.use(express.json());

app.use("/api/customers", require("./routes/customers"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/categories", require("./routes/categories"));

app.get("/api", (req, res) => res.json({ message: "Catering API is running" }));

module.exports = app;
