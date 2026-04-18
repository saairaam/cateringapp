const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");

// GET all menu items (optionally filter by type)
router.get("/", async (req, res) => {
	try {
		const filter = {};
		if (req.query.type) filter.type = req.query.type;
		const items = await MenuItem.find(filter).sort({ type: 1, name: 1 });
		res.json(items);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// GET menu item by ID
router.get("/:id", async (req, res) => {
	try {
		const item = await MenuItem.findById(req.params.id);
		if (!item) return res.status(404).json({ message: "Menu item not found" });
		res.json(item);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// POST create menu item
router.post("/", async (req, res) => {
	try {
		const item = new MenuItem(req.body);
		const saved = await item.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// PUT update menu item
router.put("/:id", async (req, res) => {
	try {
		const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!item) return res.status(404).json({ message: "Menu item not found" });
		res.json(item);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// DELETE menu item
router.delete("/:id", async (req, res) => {
	try {
		const item = await MenuItem.findByIdAndDelete(req.params.id);
		if (!item) return res.status(404).json({ message: "Menu item not found" });
		res.json({ message: "Menu item deleted successfully" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
