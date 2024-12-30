/**
 * @swagger
 * /api/user-profile/{email}:
 *   get:
 *     summary: Get user profile by email
 *     description: Fetches the user profile using the provided email address.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email of the user
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/contact-us:
 *   get:
 *     summary: Get all contact us records
 *     description: Fetches all records from the contact us table.
 *     responses:
 *       200:
 *         description: List of contact us records
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/search-pop-vin/{vin}:
 *   get:
 *     summary: Search by VIN
 *     description: Retrieves details of a vehicle using its VIN.
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: VIN of the vehicle
 *     responses:
 *       200:
 *         description: Vehicle details retrieved successfully
 *       404:
 *         description: Vehicle not found
 */

/**
 * @swagger
 * /api/csv-import:
 *   get:
 *     summary: Get bulk sheet data
 *     description: Retrieves bulk sheet data from the database.
 *     responses:
 *       200:
 *         description: Bulk sheet data retrieved successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/csv-import-sheet2:
 *   get:
 *     summary: Get bulk sheet data (Sheet 2)
 *     description: Retrieves bulk sheet data from Sheet 2.
 *     responses:
 *       200:
 *         description: Bulk sheet data retrieved successfully
 *       500:
 *         description: Server error
 */
