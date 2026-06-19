const validateMiddleware = (schema) => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {
            const err = new Error("Validation failed");
            err.statusCode = 400;
            err.details = result.error.issues;
            return next(err);

        }

        // Replace body with parsed data
        req.body = result.data;

        next();

    };

};

module.exports = validateMiddleware;