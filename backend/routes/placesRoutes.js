const express = require('express');
const router = express.Router();
const { getNearbyPlaces, getPlacePhoto } = require('../controllers/placesController');

router.get('/places', getNearbyPlaces);
router.get('/places/photo', getPlacePhoto);

module.exports = router;
