const express = require('express');
const app = express();
const port = 4000;
const passManager = require('./service/pass-manager');
const User = require('./model/user');
const Park = require('./model/park');
const Ticket = require('./model/ticket');
const Location = require('./model/location');
const db = require('./config/database');
const cors = require('cors');
const authMan = require('./auth/jwtManager');
const dateController = require('./utils/dateManager');
const ticketManager = require('./utils/ticketsFunctions');

//-----------------------------config---------------------------------

app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

app.get('/', (req, res) => {
  return res.send('Hello World!');
});

//-----------------------------initialization----------------------------------
/**
 * initialize tables of database in conformity to the definition of model entities
 * the table will be empty..
 */
db.sync({ force: true }).then(async()=>{
  let informatica = await Location.create({name:'A',description:'polo informatica'});
  for (let index = 1; index < 21; index++) {
    let park = await Park.create({
      codeNumber: index,
      info:informatica.name
    });
    await park.setLocation(informatica);
  }
  let quaccko = await User.create({email:'big.quaccko@gmail.com',username:'big.quaccko',password:passManager.generatePass('ciao')});
  let marco= await User.create({email:'marco.montanari@gmail.com',username:'marco.montanari',password:passManager.generatePass('marco')});
  let start = dateController.createDate(new Date('2022 02 11 11:32:00'));
  let end =  dateController.createDate(new Date('2022 02 11 17:54:00'));
  if(dateController.controlStartEnd(start,end)){
    let ticket = await quaccko.createTicket({start:start,end:end,targa:'AB123CD'});
    let park = await Park.findOne({where:{codeNumber:'3'}});
    await ticket.setPark(park);
  }  
});/* .then(async() => {
  console.log("!!done!!");
  let user = await User.create({
    firstName: 'Marco', lastName: 'Montanari'
  });
  let location = await Location.create({
    name:'Polo Informatica',
    description:'descrizione polo informatica...'
  });
  let park = await Park.create({
    codeNumber: 24,
    info:'parcheggio info'
  });
  park.setLocation(location);
  let ticket = await user.createTicket();
  ticket.setPark(park );
}); */

//------------------------------------authorization\login\register\logout-----------------------------------

//FIXME: fix functionalities of token and refresh token

app.post('/auth/registration', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let username = req.body.username;
/*   if (await User.findOne({ where: { email: email, username: username } })) res.status(500).send("this account already exists!!"); */
if (await User.findOne({ where: { email: email}})|| await User.findOne({ where: { username: username}}))
 res.status(500).send("this account already exists!!");
  else {
    await User.create({ email: email, username: username, password: passManager.generatePass(password) });
    return res.status(201).send("registration completed");
  }
});

/* where:db.Sequelize.Op.or[{username:username},{email:username}] */

app.post('/auth/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let user = await User.findOne({where: {
    [db.Sequelize.Op.or]: [
      { username: username },
      { email: username }
    ]
  }});
  if (user && passManager.comparePass(password, user.password)) {
    let accessToken = authMan.getAccessToken(user);
    let refreshToken = authMan.getRefreshToken(user);
    authMan.refreshTokens.push(refreshToken);
    return res.json({ accessToken: accessToken, refreshToken: refreshToken });
  }
  else return res.status(400).send("username or password is not correct");
});

//TODO: rivedere questo metodo
app.post("/auth/refresh", (req, res) => {
  let refreshToken = req.body.refreshToken;
  // vede se c'è il refreshToken o se è presente nella lista dei refresh tokens, se non è presente manda errore 401
  if (!refreshToken || !authMan.refreshTokens.includes(refreshToken)) return res.status(401).send("You are not authenticated!");
  let user = authMan.getUserByRefreshToken(refreshToken);
  //refresha i tokens validi
  authMan.refreshTokens = authMan.refreshTokens.filter((token) => token !== refreshToken);
  // aggiorna il token ed il refreshToken
  let newAccessToken = authMan.getAccessToken(user);
  let newRefreshToken = authMan.getRefreshToken(user);
  authMan.refreshTokens.push(newRefreshToken);
  //manda in risposta i nuovi tokens
  res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

//TODO: rivedere questo metodo
//FIXME: cambiare il meccanismo di cancellazione dei tokens..
app.post("/auth/logout", authMan.authenticateToken, (req, res) => {
  let refreshToken = req.body.refreshToken;
  if(!refreshToken) res.status(400).send('token not present');
  //refresha i tokens
  authMan.refreshTokens = authMan.refreshTokens.filter((token) => token !== refreshToken);
  //restituisce lo stato 200
  res.json("You logged out successfully.");
});

//-----------------------------prove------------------------------------

app.get("/api/prova",(req,res)=>{
  res.json(new Date());
})

app.post("/prova",(req,res)=>{
  let date =req.body.date;
  res.json(date);
})

app.get("/provaDate",(req,res)=>{
  let start =  dateController.createDate(new Date('2022 02 24 11:23:10'));
  let end =  dateController.createDate(new Date('2022 02 24 11:23:15'));
  res.json(dateController.controlStartEnd(start,end));
})

app.get("/prova/parks",async(req,res)=>{
  let parks = await ticketManager.availablePark();
  res.json(parks);
  /* let date = dateController.createDate(new Date());
  let parks = await ticketManager.getAllParksInADate(date);
  res.json(parks); */
})

app.get('/prova/getNext',async(req, res) => {
  let parkId = req.body.parkId;
  let ticket = await ticketManager.getNext(parkId);
  if(!ticket) return res.status(200).json('No tickets');
  return res.status(200).json(ticket);
})

//---------------------------------public------------------------------------

//crea una prenotazione per un parcheggio
app.post('/api/ticket/create',authMan.authenticateToken,async(req,res)=>{
  let parkId = req.body.parkId;
  let userId = req.user.id;
  let targa = req.body.targa;
  let user = await User.findOne({where:{id:userId}});
  let park = await Park.findOne({where:{codeNumber:parkId}});
  let startString = req.body.start;
  let endString = req.body.end;
  let start =  dateController.createDate(new Date(startString));
  let end =  dateController.createDate(new Date(endString));
  if(!dateController.controlStartEnd(start,end)) return res.status(500).json("Not allowed");
  let ticket = await user.createTicket({start:start,end:end,targa:targa});
  await ticket.setPark(park);
  res.json(ticket);
});

//delte a ticket of a user
app.delete('/api/ticket/delete',authMan.authenticateToken,async (req, res)=>{
  let userId=req.user.id;
  let ticketId = req.body.ticketId;
  let ticket = await Ticket.findById(ticketId);
  let tickets = await ticketManager.getActiveTickets(userId);
  if(tickets.includes(ticket)){
    await Ticket.delete({where: {id:ticketId}});
    res.sendStatus(200);
  }
  else res.sendStatus(404);
})

//vedere quanti parcheggi sono disponibili dati una certa ora;
app.get('/api/availableParks',authMan.authenticateToken ,async (req, res)=>{
  let start =  dateController.createDate(new Date(req.body.start));
  start = dateController.controlDate(start);
  if(!start) return res.statusCode(500);
  let parks = await ticketManager.getAllParksInADate(start);
  parks = parks.filter(p=>{return p.isEmpty});
  if(!parks.length) return res.json("There are no parks available for this date");
  return res.json(parks);
});

//restituisce i tickets di un utente
app.get('/api/getTickets', authMan.authenticateToken ,async (req, res)=>{
  let active = req.body.isActive;
  let user = req.user;
  let tickets;
  if(active) tickets = await ticketManager.getActiveTickets(user.id);
  else {
    let start = dateController.createDate(req.body.start);
    tickets = await ticketManager.getTickets(user.id,start);
  }
  return res.json(tickets);
});
  /* let tickets = await Ticket.findAll({where:{user_id:user.id}});
  let start = dateController.createDate(req.body.start);
  if(active){
    let date = dateController.createDate();
    tickets = tickets.filter(ticket =>{
      return (ticket.start.getTime() <= date.getTime())&&(ticket.end.getTime() > date.getTime())
    });
  }else tickets = tickets.filter(ticket =>{
    return (ticket.start.getDate()===start.getDate()) && (ticket.start.getMonth()===start.getMonth()) && (ticket.start.getFullYear()===start.getFullYear());
  });
  res.status(200).json(tickets);
}); */

