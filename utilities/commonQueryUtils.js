const paginationUtil = async (req, res) => {
    var page = parseInt(req.body.page)
    var size = parseInt(req.body.size)
    var query = {}
    if (!page) {
        page = 1
    }
    if (!size) {
        size = 5
    }
    query.skip = size * (page - 1)
    query.limit = size
    query.page = page
    return query;
}
const searchUtil = async (req, res) => {
    const query = {}
    const searchTxt = new RegExp(req.body.searchText, "i")
    query['$or'] = [{
        "nickName": searchTxt
    }, {
        "userName": searchTxt
    }]
    return query;
}
const sortUtil = async (req, res) => {
    var orderByColumn = req.body.order_by_column || 'createdAt'
    var orderByDirection = parseInt(req.body.order_by_direction) || -1
    if(orderByColumn == 'lowestUsers'){
        orderByColumn = 'usersCount'
        orderByDirection = 1
    }
    const sortQuery = {}
    sortQuery[orderByColumn] = orderByDirection
    return sortQuery;
}

const dateUtil = async (req, res) => {
    const dateQuery = {}
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    var end = new Date();
    end.setHours(23, 59, 59, 999);
    var days = 86400000;//one day in seconds 24*60*60
    console.log("@@@@@@@@@@", req.body)
    if (req.body.SortByDate === "today") {
        dateQuery.createdAt = { $gte: start, $lt: end }
        console.log(start,end)
    }
    if (req.body.SortByDate === "yesterday") {
        //number of milliseconds in a day
        oneDayAgo = new Date(start - (1 * days))
        console.log(oneDayAgo)
        dateQuery.createdAt = { $gte: oneDayAgo, $lt: start }
        return dateQuery
    }
    if (req.body.SortByDate === "week") {
        var date = new Date();
        var firstDateOfCurrentMonth = new Date(date.setDate(date.getDate() - date.getDay()+ (date.getDay() == 0 ? -6:1) ));
        var endDateOfCurrentMonth = new Date(date.setDate(date.getDate() - date.getDay() +7));
        dateQuery.createdAt = { $gte: firstDateOfCurrentMonth, $lt: endDateOfCurrentMonth }
    }
    if (req.body.SortByDate === "month") {
        var date = new Date();
        var firstDateOfCurrentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        var endDateOfCurrentMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        dateQuery.createdAt = { $gte: firstDateOfCurrentMonth, $lt: endDateOfCurrentMonth }
        return dateQuery
    }
    return dateQuery
}
module.exports = { searchUtility: searchUtil, paginationUtility: paginationUtil, sortingUtiliy: sortUtil,dateUtility:dateUtil };
