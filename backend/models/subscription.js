import mongoose from "mongoose";
import { type } from "node:os";

const subscriptionSchema = new mongoose.Schema({
    usuarioId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: [true, 'El ID de usuario es obligatorio'],
    },
    planId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Plan',
        required: [true, 'El ID de plan es obligatorio'],

    },
    fechaInicio:{
        type:Date,
        default: Date.now,
    },
    fechaFin:{
        type:Date,
        required:[true, 'La fecha de fin debe ser calculada por el servidor'],

    },
    estado:{
        type: String,
        required: true,
        enum:['Activa', 'Vencida', 'Cancelada'],
        default: 'Activa'
    }
},{
    timestamps:true,
    toJSON:{virtuals: true},
    toObject:{virtuals: true}
});

function autoPopulate() {
    this.populate('usuarioId', 'nombre email')
        .populate('planId', 'name price');
}
subscriptionSchema.pre('find', autoPopulate);
subscriptionSchema.pre('findOne', autoPopulate);
subscriptionSchema.pre('findOneAndUpdate', autoPopulate);

export default mongoose.model('Subscription', subscriptionSchema);
