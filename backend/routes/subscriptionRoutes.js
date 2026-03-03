import express from "express";
import {
    getAllSubscriptions,
    getUserSubscription,
    createSubscription
} from "../controllers/subscriptionController.js";

import { checkSubscriptionStatus } from "../middlewares/checkSubscriptionStatus.js";

const router = express.Router();

router.get("/", getAllSubscriptions);

router.post("/", createSubscription);

router.get("/:userId", checkSubscriptionStatus, getUserSubscription);

export default router;