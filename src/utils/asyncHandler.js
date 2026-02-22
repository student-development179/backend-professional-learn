//this are also good both are same but as per compony choices....
const asyncHandler = (RequestHandler) => {
    return (req, res, next) => {
        Promise.resolve(RequestHandler(req, res, next)).
        catch((err) => next(err))   
    }}

export { asyncHandler }

//this are also used in data handler this are also good 
//but some compony has differnt diff to handle data so which has compony choice which are better so 
//which are easy was you can its try

//this megafunction are
// const asyncHandler = (fn) =>  () => {}  or  =(fn) => { => {}}
//this are we used in replace to curly braces is a uniques in this


/*const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message
        })
    }
}*/