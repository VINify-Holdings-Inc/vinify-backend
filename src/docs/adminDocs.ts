/**
 * @swagger
 * /api/user-login:
 *   post:
 *     summary: User login
 *     description: User logs in with email and password.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: amit.chauhan@techwagger.com
 *               password:
 *                 type: string
 *                 example: Test@123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: 1
 *                     firstName:
 *                       type: string
 *                       example: Amit
 *                     lastName:
 *                       type: string
 *                       example: Chauhan
 *                     emailId:
 *                       type: string
 *                       example: amit.chauhan@techwagger.com
 *                     phoneNumber:
 *                       type: string
 *                       example: 9876543210
 *                     profile:
 *                       type: string
 *                       example: profile.jpg
 *                     address:
 *                       type: string
 *                       example: 1234 Tech Street, Tech City
 *                     companyId:
 *                       type: string
 *                       example: 1001
 *                     title:
 *                       type: string
 *                       example: Software Engineer
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/user-profile-update:
 *   put:
 *     summary: Update user profile
 *     description: Updates user profile information.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 1
 *               firstName:
 *                 type: string
 *                 example: Amit
 *               lastName:
 *                 type: string
 *                 example: Chauhan
 *               phoneNumber:
 *                 type: string
 *                 example: 9876543210
 *               address:
 *                 type: string
 *                 example: 1234 Tech Street, Tech City
 *               profile:
 *                 type: string
 *                 format: binary
 *                 example: profile.jpg
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: 1
 *                 firstName:
 *                   type: string
 *                   example: Amit
 *                 lastName:
 *                   type: string
 *                   example: Chauhan
 *                 phoneNumber:
 *                   type: string
 *                   example: 9876543210
 *                 address:
 *                   type: string
 *                   example: 1234 Tech Street, Tech City
 *                 profile:
 *                   type: string
 *                   example: profile.jpg
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/user-profile/{email}:
 *   get:
 *     summary: Get user profile
 *     description: Get user profile information by email.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []  # This tells Swagger that this endpoint requires Bearer authentication
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         description: User email
 *         schema:
 *           type: string
 *           example: amit.chauhan@techwagger.com
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: 1
 *                 firstName:
 *                   type: string
 *                   example: Amit
 *                 lastName:
 *                   type: string
 *                   example: Chauhan
 *                 emailId:
 *                   type: string
 *                   example: amit.chauhan@techwagger.com
 *                 phoneNumber:
 *                   type: string
 *                   example: 9876543210
 *                 address:
 *                   type: string
 *                   example: 1234 Tech Street, Tech City
 *                 profile:
 *                   type: string
 *                   example: profile.jpg
 *                 companyId:
 *                   type: string
 *                   example: 1001
 *                 title:
 *                   type: string
 *                   example: Software Engineer
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/forget-password:
 *   post:
 *     summary: Forget password
 *     description: Sends a password reset link to the user's email.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: amit.chauhan@techwagger.com
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the password using a valid token.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewPassword@123
 *               token:
 *                 type: string
 *                 example: token_generated_for_reset
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/reset-token-check:
 *   post:
 *     summary: Check reset token
 *     description: Validates whether the reset token is valid and not expired.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: token_generated_for_reset
 *     responses:
 *       200:
 *         description: Token found and valid
 *       401:
 *         description: Token expired or invalid
 *       500:
 *         description: Server error
 */
