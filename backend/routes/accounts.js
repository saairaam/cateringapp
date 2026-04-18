const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Customer = require("../models/Customer");

// GET summary for dashboard & accounts page
router.get("/summary", async (req, res) => {
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

		const [orders, totalCustomers] = await Promise.all([
			Order.find(dateFilter),
			Customer.countDocuments(),
		]);

		const totalOrders = orders.length;
		const totalRevenue = orders.reduce(
			(sum, o) => sum + (o.totalAmount || 0),
			0,
		);
		// Amount received = sum of advancePaid across all orders
		const totalReceived = orders.reduce(
			(sum, o) => sum + (o.advancePaid || 0),
			0,
		);
		// Only count pending amounts from orders that are NOT paid (calculated dynamically)
		const totalPending = orders
			.filter((o) => o.paymentStatus !== "Paid")
			.reduce(
				(sum, o) =>
					sum + Math.max(0, (o.totalAmount || 0) - (o.advancePaid || 0)),
				0,
			);
		const totalGST = orders.reduce((sum, o) => sum + (o.gstAmount || 0), 0);

		const paidOrders = orders.filter((o) => o.paymentStatus === "Paid").length;
		const partialOrders = orders.filter(
			(o) => o.paymentStatus === "Partial",
		).length;
		const pendingOrders = orders.filter(
			(o) => o.paymentStatus === "Pending",
		).length;
		const completedOrders = orders.filter(
			(o) => o.orderStatus === "Completed",
		).length;

		res.json({
			totalCustomers,
			totalOrders,
			totalRevenue,
			totalReceived,
			totalPending,
			totalGST,
			paidOrders,
			partialOrders,
			pendingOrders,
			completedOrders,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
