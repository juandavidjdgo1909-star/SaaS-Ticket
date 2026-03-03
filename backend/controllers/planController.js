import Plan from "../models/plan.js";

export const getPlans = async (req, res, next) => {
    try {
        const plans = await Plan.find();

        res.status(200).json({
            status: "success",
            data: plans
        });

    } catch (error) {
        next(error);
    }
};

export const getPlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                error: true,
                message: "Plan no encontrado"
            });
        }

        res.status(200).json({
            status: "success",
            data: plan
        });

    } catch (error) {
        next(error);
    }
};

export const createPlan = async (req, res, next) => {
    try {
        const { name, price, limiteRecursos } = req.body;

        if (!name || price == null || limiteRecursos == null) {
            return res.status(400).json({
                error: true,
                message:
                    "El nombre, el precio y el límite de recursos son obligatorios",
            });
        }

        const existingPlan = await Plan.findOne({ name });

        if (existingPlan) {
            return res.status(409).json({
                error: true,
                message: "El plan ya está registrado",
            });
        }

        const newPlan = new Plan({ name, price, limiteRecursos });

        await newPlan.save();

        res.status(201).json({
            status: "success",
            message: "Plan creado exitosamente",
            data: newPlan,
        });
    } catch (error) {
        next(error);
    }
};

export const deletePlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const plan = await Plan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                error: true,
                message: "Plan no encontrado"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Plan eliminado correctamente"
        });

    } catch (error) {
        next(error);
    }
};

export const updatePlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const updatedPlan = await Plan.findByIdAndUpdate(
            id,
            { name, price },
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({
                error: true,
                message: "Plan no encontrado"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Plan actualizado correctamente",
            data: updatedPlan
        });

    } catch (error) {
        next(error);
    }
};