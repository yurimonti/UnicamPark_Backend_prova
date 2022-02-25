const Ticket = require('../model/ticket');
const Park = require('../model/park');
const dateController = require('./dateManager');
const db = require('../config/database');

const ticketsOfParkPredicate = (ticket, parkId) => {
    return ticket.park_id === parkId
};

const getParksAvailable = async (start, end, locationId) => {
    let parks;
    if (!locationId) parks = await Park.findAll();
    else parks = await getParkInLocation(locationId);
    if (!start && !end) return parks;
    let ticketsOn;
    if (!end) {
        ticketsOn = await Ticket.findAll({
            where: {
                [db.Sequelize.Op.and]: [
                    { start: { [db.Sequelize.Op.lte]: start } },
                    { end: { [db.Sequelize.Op.gt]: start } }
                ]
            }
        });
    }
    else {
        ticketsOn = await Ticket.findAll({
            where: {
                [db.Sequelize.Op.and]: [
                    { start: { [db.Sequelize.Op.lte]: start } },
                    { end: { [db.Sequelize.Op.gte]: end } }
                ]
            }
        });
    }
    ticketsOn.forEach(t => {
        parks = parks.filter(p => { return p.id != t.park_id })
    });
    return parks;
}

const getParkInLocation = async (locationId) => {
    let parks = await Park.findAll({ where: { location_id: locationId } });
    return parks;
}

const getTicketsFiltered = async (active, userId) => {
    let tickets = await Ticket.findAll();
    if (userId) tickets = await Ticket.findAll({ where: { user_id: userId } });
    let ticketPredicate;
    let now = dateController.getNow();
    if (active) ticketPredicate = t => { return t.end.getTime() > now.getTime() };
    else ticketPredicate = t => { return t.end.getTime() < now.getTime() }
    tickets = tickets.filter(ticketPredicate);
    return tickets;
}

const getNextTicketOfPark = async (parkId) => {
    let tickets = await getTicketsFiltered(true);
    tickets = tickets.filter(t => { return t.park_id == parkId }).sort((t1, t2) => { return t1.start.getTime() - t2.start.getTime() });
    let ticket = tickets[0];
    if (!ticket) return false;
    return ticket;
}

const endOfCurrentReservation = async (parkId) => {
    let now = dateController.getNow();
    let tickets = await getTicketsFiltered(true);
    tickets = tickets.filter(t => { return t.start.getTime() <= now.getTime() }).filter(t => { return t.park_id == parkId });
    return tickets[0];
}

module.exports = { getParksAvailable, getParkInLocation, getTicketsFiltered, getNextTicketOfPark, endOfCurrentReservation }