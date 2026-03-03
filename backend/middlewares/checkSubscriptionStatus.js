import Subscription from "../models/subscription.js";
import { isExpired } from "../services/subscriptionService.js";

export const checkSubscriptionStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const subscription = await Subscription.findOne({ usuarioId: userId });

        if (subscription && subscription.estado === "Activa") {

            if (isExpired(subscription.fechaFin)) {
                subscription.estado = "Vencida";
                await subscription.save();
            }
        }

        next();

    } catch (error) {
        next(error);
    }
};