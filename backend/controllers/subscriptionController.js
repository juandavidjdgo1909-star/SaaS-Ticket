import User from "../models/user.js";
import bcrypt from 'bcryptjs';
import Subscription from "../models/subscription.js";
import Plan from "../models/plan.js";
import { calculateExpirationDate } from "../services/subscriptionService.js";

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find();
    res.status(200).json({
      status: "success",
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: { message: "Función getSubscription aún no implementada" },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "El correo electrónico ya está en uso." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'User'
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json({ status: "success", data: userResponse });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "El correo electrónico ya está en uso." });
    }
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son obligatorios." });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ status: "success", data: userResponse });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { nombre, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

export const getUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({ usuarioId: userId, estado: 'Activa' })
      .populate('usuarioId', 'nombre email')
      .populate('planId', 'name price');

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontró una suscripción activa para el usuario'
      });
    }

    res.json({ status: 'success', data: subscription });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { estado: 'Cancelada', fechaFin: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Suscripción no encontrada' });
    }

    res.status(200).json({ status: 'success', data: subscription });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const { usuarioId, planId } = req.body;

    if (!usuarioId || !planId) {
      return res.status(400).json({
        status: 'error',
        message: 'usuarioId y planId son obligatorios'
      });
    }

    const user = await User.findById(usuarioId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        status: 'error',
        message: 'Plan no encontrado'
      });
    }

    const fechaInicio = new Date();
    const fechaFin = calculateExpirationDate(fechaInicio);

    const existing = await Subscription.findOne({ usuarioId, estado: 'Activa' });
    if (existing) {
      existing.estado = 'Cancelada';
      existing.fechaFin = new Date();
      await existing.save();
    }

    const newSubscription = new Subscription({
      usuarioId,
      planId,
      fechaInicio,
      fechaFin,
      estado: 'Activa'
    });

    await newSubscription.save();

    const subscriptionWithData = await Subscription.findById(newSubscription._id)
      .populate('usuarioId', 'nombre email')
      .populate('planId', 'name price');

    res.status(201).json({
      status: 'success',
      message: 'Suscripción creada exitosamente',
      data: subscriptionWithData
    });
  } catch (error) {
    next(error);
  }
};