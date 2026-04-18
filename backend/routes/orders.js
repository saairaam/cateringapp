const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// GET all orders
router.get("/", async (req, res) => {
	try {
		const { period = "all" } = req.query;
		let dateFilter = {};

		// Build date filter based on period
		if (period === "today") {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);
			dateFilter = { createdAt: { $gte: today, $lt: tomorrow } };
		} else if (period === "month") {
			const now = new Date();
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
			dateFilter = { createdAt: { $gte: monthStart, $lt: monthEnd } };
		}
		// For 'all', no date filter

		const orders = await Order.find(dateFilter)
			.populate("customer", "name phone email")
			.populate("items.menuItem", "name type")
			.sort({ createdAt: -1 });
		res.json(orders);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// GET export orders as CSV by date (must be before /:id route)
router.get("/export/pdf", async (req, res) => {
	try {
		const { date } = req.query;
		const selectedDate = date ? new Date(date) : new Date();

		// Set date range (00:00:00 to 23:59:59)
		const startOfDay = new Date(selectedDate);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(selectedDate);
		endOfDay.setHours(23, 59, 59, 999);

		const orders = await Order.find({
			orderDate: {
				$gte: startOfDay,
				$lte: endOfDay,
			},
		})
			.populate("customer", "name phone address city")
			.populate("items.menuItem", "name")
			.sort({ mealType: 1, "customer.name": 1 });

		if (orders.length === 0) {
			return res.status(404).json({ message: "No orders found for this date" });
		}

		// Generate CSV content
		const csvHeader = [
			"Order #",
			"Customer Name",
			"Phone",
			"Meal Type",
			"Items",
			"Total Amount",
			"Advance Paid",
			"Balance Due",
			"Payment Status",
			"Order Status",
		].join(",");

		const csvRows = orders.map((order) => {
			const itemNames = order.items.map((i) => i.name).join("; ");
			return [
				order.orderNumber,
				order.customer.name || "",
				order.customer.phone || "",
				order.mealType,
				itemNames,
				order.totalAmount || 0,
				order.advancePaid || 0,
				Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0)),
				order.paymentStatus || "Pending",
				order.orderStatus || "Pending",
			]
				.map((field) => `"${field}"`)
				.join(",");
		});

		const csvContent = [csvHeader, ...csvRows].join("\n");

		// Send as file download
		res.setHeader("Content-Type", "text/csv; charset=utf-8");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="Orders_${selectedDate.toISOString().split("T")[0]}.csv"`,
		);
		res.send(csvContent);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// GET order by ID
router.get("/:id", async (req, res) => {
	try {
		const order = await Order.findById(req.params.id)
			.populate("customer")
			.populate("items.menuItem");
		if (!order) return res.status(404).json({ message: "Order not found" });
		res.json(order);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// POST create order
router.post("/", async (req, res) => {
	try {
		const order = new Order(req.body);
		const saved = await order.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// PUT update order (supports partial updates - used for payment updates)
router.put("/:id", async (req, res) => {
	try {
		const updateData = { ...req.body };

		// Normalise nested refs if populated objects were passed
		if (updateData.customer && typeof updateData.customer === "object") {
			updateData.customer = updateData.customer._id;
		}
		if (Array.isArray(updateData.items)) {
			updateData.items = updateData.items.map((item) => ({
				...item,
				menuItem:
					item.menuItem && typeof item.menuItem === "object"
						? item.menuItem._id
						: item.menuItem,
			}));
		}

		// If marking as Paid, set balanceDue to 0
		if (updateData.paymentStatus === "Paid") {
			updateData.balanceDue = 0;
		}

		const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
			new: true,
			runValidators: true,
		}).populate("customer", "name phone");

		if (!order) return res.status(404).json({ message: "Order not found" });
		res.json(order);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// DELETE order
router.delete("/:id", async (req, res) => {
	try {
		const order = await Order.findByIdAndDelete(req.params.id);
		if (!order) return res.status(404).json({ message: "Order not found" });
		res.json({ message: "Order deleted successfully" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
