function adjustHour(date){
    date.setHours(date.getHours()+1);
}

const getNow = () =>{
    return createDate(new Date());
}

/**
 * it adjusts and create a date from a string
 * @param {String} dateString string that is used to create a date
 * @returns 
 */
function createDate(dateString){
    let date;
    if(dateString) date = new Date(dateString);
    else date = new Date();
    adjustHour(date);
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