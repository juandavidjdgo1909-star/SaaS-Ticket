import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del plan es obligatorio'],
        enum: ['Basic', 'Pro', 'Platinum'],
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'El precio es Obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    limiteRecursos: {
        type: Number,
        required: [true, 'El límite de recursos es obligatorio'],
    },
    },
    {timestamps:true},
);

export default mongoose.model('Plan', planSchema);