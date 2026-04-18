const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// GET all categories
router.get("/", async (req, res) => {
	try {
		const categories = await Category.find().sort({ name: 1 });
		res.json(categories);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// POST create category
router.post("/", async (req, res) => {
	try {
		const category = new Category({ name: req.body.name });
		const saved = await category.save();
		res.status(201).json(saved);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

// DELETE category
router.delete("/:id", async (req, res) => {
	try {
		const category = await Category.findByIdAndDelete(req.params.id);
		if (!category)
			return res.status(404).json({ message: "Category not found" });
		res.json({ message: "Category deleted" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

module.exports = router;
