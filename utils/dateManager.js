function adjustHour(date){
    date.setHours(date.getHours()+1);
}

const getNow = () =>{
    return new Date();
}

/**
 * it creates a date from a string
 * @param {Number} hours string that rapresent hours;
 * @param {Number} minutes string that rapresent minutes;
 * @returns a current date with hours and minutes setted.
 */
function createDate(hours,minutes){
    let date = new Date();
    if(!hours&&!minutes) return date;
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

function controlDate(date){
    if(date.getHours()>=9 && date.getHours()<=18)return date;
    else return null;
}

function controlStartEnd(start,end){
    start = controlDate(start);
    end = controlDate(end);
    if((!start)||(!end))return false;
    if((start.getTime()>=end.getTime())||(start.getDate()!=end.getDate())||(start.getMonth()!=end.getMonth())||(start.getFullYear()!=end.getFullYear())) return false;
    else return true;
}

function getTimeStringFromDate(date){
    let result = date.getHours()+":"+ date.getMinutes();
    return result;
}

module.exports = {getNow,controlStartEnd,controlDate,createDate,getTimeStringFromDate};