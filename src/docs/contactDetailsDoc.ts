/**
 * @swagger
 * /api/contact-us:
 *   post:
 *     summary: Insert a contact-us record
 *     description: Insert a new contact-us record.
 *     tags: [ContactUs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *               subject:
 *                 type: string
 *           example:
 *             name: John Doe
 *             email: johndoe@example.com
 *             phone: "999-831-332"
 *             message: I have a question about your services.
 *             subject: Inquiry
 *     responses:
 *       201:
 *         description: Contact us record inserted successfully.
 *       400:
 *         description: Bad request. Missing required fields.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/contact-us/{id}:
 *   put:
 *     summary: Update a contact-us record
 *     description: Update an existing contact-us record by ID.
 *     tags: [ContactUs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the contact-us record to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact us record updated successfully.
 *       400:
 *         description: Bad request. Invalid input data.
 *       404:
 *         description: Contact us record not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/contact-us:
 *   get:
 *     summary: Retrieve all ContactUs records
 *     description: Retrieves all ContactUs records from the database.
 *     tags: [ContactUs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page number for pagination (default is 1).
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: The number of records per page (default is 10).
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: email
 *         in: query
 *         description: Filter records by email.
 *         required: false
 *         schema:
 *           type: string
 *       - name: message
 *         in: query
 *         description: Filter records by message content.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of ContactUs records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItems:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/contact-us/{id}:
 *   delete:
 *     summary: Delete a ContactUs record
 *     description: Deletes a ContactUs record by ID.
 *     tags: [ContactUs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the ContactUs record to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ContactUs record deleted successfully.
 *       404:
 *         description: ContactUs record not found.
 *       500:
 *         description: Internal server error.
 */
