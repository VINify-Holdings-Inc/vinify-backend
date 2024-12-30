/**
 * @swagger
 * /api/csv-import:
 *   post:
 *     summary: Insert bulk data from CSV
 *     description: Endpoint to insert bulk data for vehicles from CSV.
 *     tags:
 *       - CSV Import
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     VIN:
 *                       type: string
 *                     Title:
 *                       type: string
 *                     Brand:
 *                       type: string
 *                     Insurance:
 *                       type: string
 *                     Junk_Salvage:
 *                       type: string
 *     responses:
 *       201:
 *         description: Bulk data inserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data inserted successfully"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
  /**
 * @swagger
 * /api/csv-import:
 *   get:
 *     summary: Get bulk data for vehicles
 *     description: Fetch paginated bulk data for vehicles with filters.
 *     tags:
 *       - CSV Import
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: vin
 *         schema:
 *           type: string
 *         description: VIN filter
 *     responses:
 *       200:
 *         description: Successfully fetched bulk data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 totalItems:
 *                   type: integer
 *                   example: 100
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vin:
 *                         type: string
 *                       title:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
 /**
 * @swagger
 * /api/csv-import-sheet2:
 *   post:
 *     summary: Insert bulk data from CSV for Sheet2
 *     description: Endpoint to insert bulk data for vehicles from a second CSV sheet.
 *     tags:
 *       - CSV Import
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     VIN:
 *                       type: string
 *                     Make:
 *                       type: string
 *                     Brand_Code:
 *                       type: string
 *                     SOT:
 *                       type: string
 *                     status:
 *                       type: string
 *     responses:
 *       201:
 *         description: Bulk data inserted successfully for Sheet2
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data inserted successfully"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
 /**
 * @swagger
 * /api/csv-import-sheet2:
 *   get:
 *     summary: Get bulk data for vehicles from Sheet2
 *     description: Fetch paginated bulk data for vehicles from the second CSV sheet with filters.
 *     tags:
 *       - CSV Import
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully fetched bulk data for Sheet2
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 totalItems:
 *                   type: integer
 *                   example: 100
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vin:
 *                         type: string
 *                       member:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/search-pop-vin/{vin}:
 *   get:
 *     summary: Search for vehicle data by VIN
 *     description: Search for vehicle data based on VIN.
 *     tags:
 *       - CSV Import
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         example: "1FTCF15N5HLA06223"
 *         schema:
 *           type: string
 *         description: VIN of the vehicle to search for
 *     responses:
 *       200:
 *         description: Successfully fetched vehicle data for the VIN
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vin:
 *                   type: string
 *                 model:
 *                   type: string
 *       404:
 *         description: VIN not found
 *       500:
 *         description: Internal server error
 */ 