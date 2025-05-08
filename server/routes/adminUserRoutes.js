const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');

router.get('/get-all-users', getAllUsers);
router.get('/get-user/:id;', getUserById);
router.post('/create-user', createUser);
router.patch('/update-user/:id', updateUser);
router.delete('/delete-user/:id', deleteUser);

module.exports = router;