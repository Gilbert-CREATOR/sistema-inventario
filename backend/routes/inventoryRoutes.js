const express = require('express');
const router = express.Router();

// Defining routes
router.get('/items', (req, res) => {
    res.send('List of inventory items');
});

module.exports = router;