const express = require('express');
     const router = express.Router();
     const { check } = require('express-validator');
     const authController = require('../controllers/authController');

     router.post(
       '/login',
       [
         check('email', 'Please include a valid email').isEmail(),
         check('password', 'Password is required').exists(),
         check('role', 'Role must be admin or student').isIn(['admin', 'student']),
       ],
       authController.login
     );

     module.exports = router;