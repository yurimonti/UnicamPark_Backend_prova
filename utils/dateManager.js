const getNow = () =>{
    return new Date();
}

/**
 * it creates a date from a string
 * @param {Number} hours string that rapresent hours;
 * @param {Number} minutes string that rapresent minutes;
 * @param {Number} seconds string that rapresent seconds;
 * @param {Number} milliseconds string that rapresent milliseconds;
 * @returns {Date} a current date with time setted.
 */
function createDate(hours,minutes,seconds,milliseconds){
    let date = new Date();
    if(!hours&&!minutes) return date;
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    if(seconds) date.setSeconds(seconds);
    date.setMilliseconds(0);
    if(milliseconds)date.setMilliseconds(milliseconds);
    return date;
}

/**
 * @param {Date} start 
 * @param {Date} end 
 * @returns {Boolean}
 */
function startEndCheck(start,end){
    if((checkDate(start) && checkDate(end))&&(start.getTime() < end.getTime()))return true;
    else return false;
}

/**
 * 
 * @param {Date} date 
 * @returns {Boolean} true if date hours value fit between 9 and 18 
 */
function checkDate(date){
    if(date.getHours()>=9 && date.getHours()<=18) return true;
    else return false;
}

/**
 * @param {Date} date to convert
 * @returns {String} format "hours" : "minutes"
 */
function getTimeStringFromDate(date){
    let result = date.getHours()+":"+ date.getMinutes();
    return result;
}

module.exports = {getNow,checkDate,startEndCheck,createDate,getTimeStringFromDate};