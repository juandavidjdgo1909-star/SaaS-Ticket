export const requestLogger = (req, res, next) => {
    const start= Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const date = new Date(start).toLocaleString();
        const {method, originalUrl, ip} = req
        const status = res.statusCode;
        console.log(`[${date}] METODO: ${method} | RUTA: ${originalUrl} |
        IP: ${ip} | STATUS: ${status} | TIEMPO: ${duration}`);
    });
    next();
}