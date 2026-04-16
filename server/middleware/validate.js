export const validate = (schema) => (req, res, next) => {
    try {
        // Parse the request body against the provided schema
        schema.parse(req.body);
        next();
    } catch (error) {
        // If validation fails, extract the specific error messages from Zod
        const errors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        
        res.status(400).json({ 
            error: "Validation failed", 
            details: errors 
        });
    }
};