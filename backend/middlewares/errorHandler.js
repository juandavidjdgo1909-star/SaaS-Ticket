export const globalErrorHandler = (err, req, res, next) => {
    let statusCode= err.statusCode || 500;
    let message= err.message || 'Error interno del servidor';

    if(err.code === 11000){
        statusCode= 409;
        message= 'El recurso ya existe (Email o SKU duplicado)';
    }

    if (err.name === 'CastError'){
        statusCode=400;
        message= 'El ID proporcionado no tiene un formato valido';
    }
    if (err.message.includes('Payment Required')) {
        statusCode = 402;
        message = 'El pago es requerido para realizar esta acción';
    }
    res.status(statusCode).json({
        error:true,
        status: statusCode,
        message: message
    })
};