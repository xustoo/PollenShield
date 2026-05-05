import { Request, Response } from "express";
import { createUser, getUserById, loginUserByEmail, updateUserPreferences } from "../services/userProfileService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return fail(res, 400, "name, email and password are required");
    }

    const user = await createUser(req.body);
    return ok(res, user, 201);
  } catch (error) {
    console.error("Register user failed", error);
    return fail(res, 500, "Could not register user", errorDetails(error));
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return fail(res, 400, "email and password are required");
    }

    const user = await loginUserByEmail(email, password);
    if (!user) {
      return fail(res, 401, "Invalid email or password");
    }

    return ok(res, { message: "Login successful", user });
  } catch (error) {
    console.error("Login failed", error);
    return fail(res, 500, "Could not login", errorDetails(error));
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return fail(res, 404, "User not found");
    }

    return ok(res, user);
  } catch (error) {
    console.error("Get profile failed", error);
    return fail(res, 500, "Could not get user profile", errorDetails(error));
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const user = await updateUserPreferences(req.params.userId, req.body);
    if (!user) {
      return fail(res, 404, "User not found");
    }

    return ok(res, user);
  } catch (error) {
    console.error("Update preferences failed", error);
    return fail(res, 500, "Could not update preferences", errorDetails(error));
  }
};
