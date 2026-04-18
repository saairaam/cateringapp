const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
	menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
	name: { type: String, required: true },
	pricePerPerson: { type: Number, required: true },
	quantity: { type: Number, default: 1, min: 1 },
});

const orderSchema = new mongoose.Schema(
	{
		orderNumber: { type: String, unique: true },
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Customer",
			required: true,
		},
		orderDate: { type: Date, default: Date.now },
		mealType: {
			type: String,
			enum: ["breakfast", "lunch", "dinner"],
			required: true,
		},
		items: [orderItemSchema],
		subtotal: { type: Number, default: 0 },
		totalAmount: { type: Number, default: 0 },
		advancePaid: { type: Number, default: 0 },
		balanceDue: { type: Number, default: 0 },
		paymentStatus: {
			type: String,
			enum: ["Pending", "Partial", "Paid"],
			default: "Pending",
		},
		orderStatus: {
			type: String,
			enum: ["Confirmed", "In-Progress", "Completed", "Cancelled"],
			default: "Confirmed",
		},
		notes: { type: String, trim: true },
	},
	{ timestamps: true },
);

orderSchema.pre("save", async function (next) {
	if (!this.orderNumber) {
		const count = await this.constructor.countDocuments();
		const year = new Date().getFullYear();
		this.orderNumber = `CAT-${year}-${String(count + 1).padStart(4, "0")}`;
	}
	next();
});

module.exports = mongoose.model("Order", orderSchema);
