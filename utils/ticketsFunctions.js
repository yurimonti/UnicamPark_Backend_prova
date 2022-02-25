const Ticket = require('../model/ticket');
const Park = require('../model/park');
const dateController = require('./dateManager');
const db = require('../config/database');

const getTickets = async (userId,date)=>{
  let tickets;
  if(userId) tickets = await Ticket.findAll({where: {user_id: userId}}); 
  else tickets = await Ticket.findAll();
  if(date) tickets = tickets.filter(t=>((t.start.getDate() == date.getDate()) && (t.start.getMonth() == date.getMonth()) && (t.start.getYear() == date.getYear())));
  return tickets;
}

const getActiveTickets = async(userId)=>{
    let now = dateController.createDate(new Date());
    let tickets;
    if(userId) tickets = await Ticket.findAll({where: {user_id:userId}});
    else tickets = await Ticket.findAll();
    tickets = tickets.filter(ticket=>{
      return (ticket.start.getTime()<=now.getTime())&&(ticket.end.getTime()>now.getTime())
    });
    return tickets;
}

const getFutureTickets = async(userId) =>{
  let now = dateController.createDate(new Date());
    let tickets;
    if(userId) tickets = await Ticket.findAll({where: {user_id:userId}});
    else tickets = await Ticket.findAll();
    tickets = tickets.filter(ticket=>{
      return (ticket.start.getTime() > now.getTime());
    });
    return tickets;
}

const getAllParksInADate = async(date)=>{
  let tickets = await Ticket.findAll();
  let parks =await Park.findAll();
  if(date){
    tickets = tickets.filter(ticket=>{
      return (ticket.start.getTime()<=date.getTime())&&(ticket.end.getTime()>date.getTime())
    });
  } else{
    let now = dateController.createDate(new Date());
    tickets = tickets.filter(ticket=>{
      return (ticket.start.getTime()<=now.getTime())&&(ticket.end.getTime()>now.getTime())
    });
  }
  let ticketParks = await Promise.all(tickets.map(async ticket=>{
    return await ticket.getPark();
  }));
  for(let ticketPark of ticketParks){
    let park = parks.find(element => element.id==ticketPark.id);
    park.isEmpty = false;
  }
  return parks;
}

const availablePark = async()=>{
  let parks = await Park.findAll();
  let now = dateController.createDate(new Date());
  let tickets = await Ticket.findAll({where:{[db.Sequelize.Op.and]:[
      { start:{[db.Sequelize.Op.lte]:now}},
      { end:{[db.Sequelize.Op.gt]:now}}
    ]
  }});
  for(let ticket of tickets){
    let park = parks.find(element => element.id==ticket.park_id);
    park.isEmpty = false;
  }
  parks = parks.filter(park=>{
    return park.isEmpty;
  })
  return parks;
}

const getNext = async(parkId) => {
  let tickets = await getFutureTickets();
  tickets = tickets.filter(t => {return t.park_id ==parkId}).sort((t1,t2)=>{return t1.start.getTime()-t2.start.getTime()});
  let ticket = tickets[0];
  return ticket;
}


module.exports = {getActiveTickets, getAllParksInADate,getFutureTickets,availablePark,getTickets,getNext}