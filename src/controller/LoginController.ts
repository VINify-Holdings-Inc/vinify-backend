import jwt from "jsonwebtoken";
import { Login } from "../Entities/login";
import { User } from "../Entities/user";
import { sendEmail } from "../helpers/email";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { generateToken, profileCompletion } from "../helpers/utils";
import path from "path";
import fs from "fs";
export const TestRoute = async (req: any, res: any) => {
    try {
        const { email } = req.params;

        // Execute the query to fetch the user data with a LEFT JOIN on the Login table
        const queryBuilder = User.createQueryBuilder("user")
            .leftJoinAndSelect(Login, "login", "user.emailId = login.emailId")
            .where("user.emailId = :email", { email });

        // Fetch the user data
        const userData = await queryBuilder.getRawOne();

        // If no user data is found, return a 404 response
        if (!userData) {
            return res.status(404).json({ message: "Data not found", success: false });
        }

        // Return a successful response with the fetched data
        return res.status(200).json({
            message: "Data fetched successfully",
            data: userData,
            success: true,
        });
    } catch (error: any) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log("Error fetching data:", error);

        // Return a 500 response for internal server errors
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const LoginController = async (req: any, res: any) => {
    try {
        const { email, password } = req.body;

        // Fetch login entry based on email and select userId and password for optimized query
        const login = await Login.findOne({
            where: { emailId: email },
            select: ["userId", "password"]
        });

        // Check if login entry exists
        if (!login) {
            return createResponse(res, 404, MESSAGES?.USER_NOT_FOUND, [], false, true);
        }

        // Fetch user data using the userId and select only necessary fields
        const user = await User.findOne({
            where: { userId: login.userId },
            select: [
                "id", "userId", "firstName", "lastName", "emailId", "phoneNumber", "profile",
                "address", "companyId", "title", "createdAt", "secondaryEmailId"
            ],
        });

        // Check if user exists
        if (!user) {
            return createResponse(res, 404, MESSAGES?.USER_NOT_FOUND, [], false, true);
        }

        // Compare provided password with stored password (plaintext comparison assumed)
        if (login.password !== password) {
            return createResponse(res, 401, MESSAGES?.INVALID_CREDENTIALS, [], false, true);
        }

        // Create JWT token with userId and email as payload
        const JWT_SECRET: any = process.env.JWT_SECRET;
        const token = jwt.sign({ id: user.userId, email: user.emailId }, JWT_SECRET, {
            expiresIn: "24h",
        });

        // Calculate profile completion percentage
        const profileComplete = await profileCompletion(user);

        // Send response with necessary data and token
        return createResponse(res, 200, MESSAGES?.LOGIN_SUCCESS, {
            memberId: user?.userId,
            id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.emailId,
            phoneNumber: user?.phoneNumber,
            profile: user?.profile,
            address: user?.address,
            companyId: user?.companyId,
            title: user?.title,
            createdAt: user?.createdAt,
            token,
            profileComplete
        });

    } catch (error) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Send a 500 response for internal server error
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const ForgetPassword = async (req: any, res: any, next: any) => {
    const { email } = req.body;

    try {
        // Fetch user data using the email from the `Login` table
        const user = await Login.findOne({ where: { emailId: email } });

        if (user) {
            // Generate a new token for the password reset
            const token = await generateToken();

            // Update the user's record with the new token and update timestamp
            await Login.update({ emailId: email }, { loginToken: token, updatedAt: new Date() });

            // Send a reset password email with the token as a URL parameter
            await sendEmail(email, "Reset Password", "", `${process.env.UI_BASE_URL}/resetpassword/${token}`);

            // Send a success response for the reset link
            return createResponse(res, 200, MESSAGES?.RESET_LINK_SENT);
        } else {
            // If user not found, send a user not found response
            return createResponse(res, 404, MESSAGES?.USER_NOT_FOUND, [], false, true);
        }

    } catch (err) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log(MESSAGES?.RESET_LINK_ERROR, err);

        // Send a 500 response for internal server error
        return createResponse(res, 500, MESSAGES?.RESET_LINK_ERROR, [], false, true);
    }
};

export const ResetPassword = async (req: any, res: any, next: any) => {
    const { password, token } = req.body;

    try {
        // Fetch user data using the token from the `Login` table
        const user = await Login.findOne({ where: { loginToken: token } });

        if (user) {
            // Extract the token issued time from the `updatedAt` field
            const tokenIssuedAt = new Date(user.updatedAt).getTime(); // Token issued timestamp
            const currentTime = Date.now(); // Current timestamp
            const tokenExpiryTime = 300000; // 5 minutes in milliseconds

            // Check if token is still valid based on the expiry time
            if ((currentTime - tokenIssuedAt) <= tokenExpiryTime) {
                // Update the user's password and clear the login token
                await Login.update({ loginToken: token }, { loginToken: "", password: password });

                // Send a success response for password update
                return createResponse(res, 200, MESSAGES?.PASSWORD_UPDATED);
            } else {
                // If the token has expired, clear the login token
                await Login.update({ loginToken: token }, { loginToken: "" });

                // Send a response indicating token expiration
                return createResponse(res, 401, MESSAGES?.TOKEN_EXPIRED, [], false, true);
            }
        } else {
            // If token not found, send an invalid token response
            return createResponse(res, 404, MESSAGES?.INVALID_TOKEN, [], false, true);
        }
    } catch (err) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log(MESSAGES?.RESET_ERROR, err);

        // Send a 500 response for internal server error
        return createResponse(res, 500, MESSAGES?.RESET_ERROR, [], false, true);
    }
};

export const ResetTockenCheck = async (req: any, res: any, next: any) => {
    const { token } = req.body;

    try {
        // Check if the token is provided in the request body
        if (!token) {
            return createResponse(res, 404, "Please provide token", [], false, true);
        }

        // Fetch user data using the token from the `Login` table
        const user = await Login.findOne({ where: { loginToken: token } });

        if (user) {
            // Extract the token issued time from the `updatedAt` field
            const tokenIssuedAt = new Date(user?.updatedAt).getTime();
            const currentTime = Date.now();
            const tokenExpiryTime = 300000; // Token expiry time in milliseconds (5 minutes)

            // Check if token has expired based on the expiry time
            if (currentTime - tokenIssuedAt > tokenExpiryTime) {
                return createResponse(res, 401, MESSAGES?.TOKEN_EXPIRED, [], false, true);
            }

            // Token is valid, send a success response
            return createResponse(res, 200, MESSAGES?.TOKEN_FOUND, [], true, false);
        }

        // Token not found in the database, send an invalid token response
        return createResponse(res, 401, MESSAGES?.INVALID_TOKEN, [], false, true);

    } catch (err) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log(MESSAGES?.RESET_ERROR, err);

        // Send a 500 response for internal server error
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const ProfileUpdate = async (req: any, res: any) => {
    const { email } = req.params;

    try {
        // Fetch user data from the `User` table using the provided email
        // This retrieves selected fields only
        const userData = await User.findOne({
            where: { emailId: email },
            select: ["userId", "userType", "firstName", "profile", "lastName", "emailId",
                "phoneNumber", "address", "status", "secondaryEmailId", "companyId", "title", "updatedAt", "createdAt"],
        });

        // Calculate profile completion percentage based on the user data
        const profileComplete = await profileCompletion(userData);

        // Fetch login data from the `Login` table using the provided email
        // Only fetches the `password` field
        const loginData = await Login.findOne({
            where: { emailId: email },
            select: ["password"],
        });

        // Check if user data was found; if not, send a 404 response
        if (!userData) {
            return createResponse(res, 404, MESSAGES?.USER_NOT_FOUND, [], true, false);
        }

        // Combine user data and login data into a single response object
        const responseData = {
            userId: userData?.userId,
            userType: userData?.userType,
            firstName: userData?.firstName,
            lastName: userData?.lastName,
            emailId: userData?.emailId,
            phoneNumber: userData?.phoneNumber,
            address: userData?.address,
            secondaryEmailId: userData?.secondaryEmailId,
            profile: userData?.profile,
            companyId: userData?.companyId,
            title: userData?.title,
            // Include the password from the login data, or null if not available
            password: loginData?.password || null,
            updatedAt: userData?.updatedAt,
            last_record_updated: userData?.createdAt,
            profileComplete
        };

        // Send a successful response with the combined data
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, responseData, true, false);

    } catch (error: any) {
        // Log the error to the console for debugging purposes
        // tslint:disable-next-line:no-console
        console.log("Error fetching user data:", error);

        // Send a 500 response with the error message
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const userProfileUpdate = async (req: any, res: any) => {
    try {

        let profileFilename = null;

        // Handle file upload using multer
        if (req.files && req.files.profile) {
            const file = req.files.profile;
            const uploadDir = path.join(__dirname, "../uploads");
            // Ensure the directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const uploadPath = path.join(uploadDir, fileName);
            await file.mv(uploadPath);
            profileFilename = fileName;
        }

        const {
            userId,
            firstName,
            lastName,
            companyId,
            title,
            secondaryEmailId,
            address,
            phoneNumber,
            password
        } = req.body;

        // Validate required fields
        if (!userId) {
            return createResponse(res, 400, "User ID is required", [], false, true);
        }

        // Prepare update data for User table
        const updateData: Record<string, any> = {
            firstName,
            lastName,
            companyId,
            title,
            secondaryEmailId,
            address,
            phoneNumber,
            updatedBy: userId,
            updatedAt: new Date()
        };

        // Include profile picture if uploaded
        if (profileFilename) {
            updateData.profile = profileFilename;
        }

        // Update user record in User table
        const result = await User.createQueryBuilder()
            .update(User)
            .set(updateData)
            .where("userId = :userId", { userId })
            .returning(["userId", "firstName", "lastName", "companyId", "title", "secondaryEmailId", "address", "phoneNumber", "profile", "updatedAt"])
            .execute();

        if (result.affected === 0) {
            return createResponse(res, 404, MESSAGES?.USER_NOT_FOUND, [], false, true);
        }

        const profileComplete = await profileCompletion(result.raw[0]);

        // Update password in Login table, if provided
        if (password) {
            await Login.createQueryBuilder()
                .update(Login)
                .set({ password, updatedAt: new Date(), updatedBy: userId })
                .where("userId = :userId", { userId })
                .execute();
        }

        const updatedUserData = result.raw[0];

        return createResponse(res, 200, MESSAGES?.PROFILE_UPDATED,
            { ...updatedUserData, profileComplete },
            true, false);
    } catch (err) {
        // tslint:disable-next-line:no-console
        console.log(MESSAGES?.RESET_ERROR, err);

        // Respond with error message
        return createResponse(res, 200, MESSAGES?.INTERNAL_SERVER_ERROR, true, false);
    }
};
