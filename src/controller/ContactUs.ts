
import { ContactUs } from "../Entities/ContactUs";
import { MESSAGES } from "../helpers/constants";
import { sendContactFormEmail } from "../helpers/email";
import { createResponse } from "../helpers/response";

export const insertContactUs = async (req: any, res: any) => {
    try {
        // Extract required fields from the request body
        const { name, email, phone, message, subject } = req.body;

        // Check for required fields: email and message
        if (!email || !message) {
            return createResponse(res, 400, MESSAGES?.REQUIRED_FIELDS, [], false, true);
        }

        // Create a new ContactUs instance and assign the provided data
        const newContactUs = new ContactUs();
        newContactUs.name = name;
        newContactUs.email = email;
        newContactUs.phone = phone;
        newContactUs.message = message;
        newContactUs.subject = subject;

        // Save the contact form data to the database
        await newContactUs.save();

        // Send email notification after successfully saving the contact form data
        await sendContactFormEmail(name, email, phone, message, subject);

        // Prepare response data to be sent back to the client
        const responseData = {
            id: newContactUs.id,
            email: newContactUs.email,
            message: newContactUs.message,
        };

        // Send success response with created data
        return createResponse(res, 201, MESSAGES?.CONTACT_SAVED, responseData);
    } catch (error) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const readContactUs = async (req: any, res: any) => {
    try {
        // Extracting pagination and filter parameters from the query
        const { page = 1, limit = 10, ...filters } = req.query;

        // Initialize query builder for 'ContactUs' entity
        const queryBuilder = ContactUs.createQueryBuilder("ContactUs");

        // Apply filters dynamically based on the query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value && key !== "page" && key !== "limit") {
                // Apply LIKE condition to filter based on the value
                queryBuilder.andWhere(`LOWER(ContactUs.${key}) LIKE LOWER(:${key})`, {
                    [key]: `%${value}%`
                });
            }
        });

        // Calculate pagination offset based on the page and limit
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Fetch the items and total count from the database
        const [items, totalItems] = await queryBuilder
            .skip(offset) // Skip the records based on offset
            .take(parseInt(limit as string)) // Limit the number of records based on 'limit'
            .getManyAndCount(); // Get both items and total count

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalItems / parseInt(limit as string));

        // Return the response with the fetched data
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: parseInt(page as string),
            totalPages,
            totalItems,
            items,
        }, true, false);
    } catch (error) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return error response in case of failure
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const deleteContactUs = async (req: any, res: any) => {
    try {
        // Extract the 'id' parameter from the request
        const { id } = req.params;

        // Find the contact message with the provided 'id'
        const contactMessage = await ContactUs.findOne(id);

        // If no contact message is found, return a 404 response
        if (!contactMessage) {
            return createResponse(res, 404, MESSAGES?.CONTACT_NOT_FOUND, [], false, true);
        }

        // Remove the contact message from the database
        await contactMessage.remove();

        // Return a success response indicating the contact message has been deleted
        return createResponse(res, 200, MESSAGES?.CONTACT_DELETED);
    } catch (error) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return a 500 response for internal server errors
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};
