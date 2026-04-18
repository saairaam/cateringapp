const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		type: {
			type: String,
			enum: ["breakfast", "lunch", "dinner"],
			required: true,
		},
		category: { type: String, trim: true, default: "" },
		description: { type: String, trim: true },
		pricePerPerson: { type: Number, required: true, min: 0 },
		available: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
