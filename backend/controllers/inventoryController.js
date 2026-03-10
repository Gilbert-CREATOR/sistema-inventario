const itemService = require('../services/itemService');

exports.getItems = (req, res) => {
    const items = itemService.getAllItems();
    res.json(items);
};