import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'], 
    unique: true 
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  rol: {
    type: String,
    enum: ['Admin', 'User'],
    default: 'User'
  },
  fechaRegistro: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("User", userSchema);