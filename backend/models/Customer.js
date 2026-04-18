const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		phone: { type: String, trim: true },
		address: { type: String, trim: true },
		city: { type: String, trim: true },
		advance: { type: Number, default: 0, min: 0 },
		notes: { type: String, trim: true },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);
