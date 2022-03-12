const Ticket = require('../model/ticket');
const Park = require('../model/park');
const db = require('../config/database');

const getParksAvailable = async (start, end/* , locationId */) => {
    let parks = await Park.findAll();
    let ticketsOn;
    /* if (!locationId) parks = await Park.findAll();
    else parks = await getParkInLocation(locationId); */
    if (!start && !end) {
        let now = new Date();
        ticketsOn = await Ticket.findAll({
            where: {
                [db.Sequelize.Op.and]: [
                    { start: { [db.Sequelize.Op.lte]: now } },
                    { end: { [db.Sequelize.Op.gt]: now } }
                ]
            }
        });
        /* ticketsOn = await Ticket.findAll();
        let ticketsToDel = ticketsOn.filter(t => {return (t.start.getTime()> now)||(t.end)}) */
        for (let park of parks) {
            if (ticketsOn.find(t => t.park_id == park.id)) park.isEmpty = false;
            else park.isEmpty = true;
            await park.save();
        }
    }
    /* if (!end) {
        ticketsOn = await Ticket.findAll({
            where: {
                [db.Sequelize.Op.and]: [
                    { start: { [db.Sequelize.Op.lte]: start } },
                    { end: { [db.Sequelize.Op.gt]: start } }
                ]
            }
        });
    } */
    else {
        /* ticketsOn = await Ticket.findAll({
            where: {
                [db.Sequelize.Op.and]: [
                    { start: { [db.Sequelize.Op.lte]: start } },
                    { end: { [db.Sequelize.Op.gte]: end } }
                ]
            }
        }); */
        ticketsOn = await Ticket.findAll();
        ticketsOn = ticketsOn.filter(t => {return ((t.start.getTime()>=start.getTime())&&(t.start.getTime()<end.getTime()))
            ||((t.end.getTime()>=start.getTime())&&(t.end.getTime()<end.getTime()))
            ||((t.start.getTime()<=start.getTime())&&(t.end.getTime()>=end.getTime()))});
        ticketsOn.forEach(t => {
            parks = parks.filter(p => { return p.id != t.park_id })
        });
    }
    return parks;
}

const getParkInLocation = async (locationId) => {
    let parks = await Park.findAll({ where: { location_id: locationId } });
    return parks;
}

const getTicketsFiltered = async (active, userId) => {
    let tickets = await Ticket.findAll();
    if (userId) tickets = await Ticket.findAll({ where: { user_id: userId } });
    let now = new Date();
    let ticketPredicate = (t) => { return t.end.getTime() < now.getTime() };
    if (active) ticketPredicate = (t) => { return t.end.getTime() > now.getTime() };
    tickets = tickets.filter(ticketPredicate);
    return tickets;
}
//FIXME: rivedere errore su next quando park !isEmpty
//FIXME: rivedere quando park è attualmente occupato e non ha nessun altra prenotazione dopo
const getNextTicketOfPark = async (parkId) => {
    let tickets = await getTicketsFiltered(true);
    let park = await Park.findByPk(parkId);
    tickets = tickets.filter(t => { return t.park_id == parkId })
        .sort((t1, t2) => { return t1.start.getTime() - t2.start.getTime()});
    if(tickets.length==0) return false;
    let ticket = tickets[0];
    if(!park.isEmpty) ticket = tickets[1];
    if(!ticket) return false;
    return ticket;
}

const endOfCurrentReservation = async (parkId) => {
    let now = new Date();
    let tickets = await getTicketsFiltered(true);
    tickets = tickets.filter(t => { return t.start.getTime() <= now.getTime() }).filter(t => { return t.park_id == parkId });
    return tickets[0];
}

module.exports = { getParksAvailable, getParkInLocation, getTicketsFiltered, getNextTicketOfPark, endOfCurrentReservation }