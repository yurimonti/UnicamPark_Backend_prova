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
const dateController = require('./utils/dateManager');
const Controller = require('./utils/controller');
const auth = require('./auth/jwtManager');
const req = require('express/lib/request');
const res = require('express/lib/response');

app.use(cors());
app.use(express.json());

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

app.get('/', (req, res) => {
    return res.send('Hello World!');
});

//TODO:cancellare dopo prove
const thisNow = ()=>{
    let now = new Date();
    console.log(now.getHours()+' '+now.getMonth());
}

thisNow();

//-----------------------------initialization----------------------------------
/**
 * initialize tables of database in conformity to the definition of model entities
 * the table will be empty..
 */
db.sync({ force: true }).then(async () => {
    let informatica = await Location.create({ name: 'A', description: 'polo informatica' });
    for (let index = 1; index < 21; index++) {
        let park = await Park.create({
            codeNumber: index,
            info: informatica.name
        });
        await park.setLocation(informatica);
    }
    let quaccko = await User.create({ email: 'big.quaccko@gmail.com', username: 'big.quaccko', password: passManager.generatePass('ciao') });
    let marco = await User.create({ email: 'marco.montanari@gmail.com', username: 'marco.montanari', password: passManager.generatePass('marco') });
    /* let start = dateController.createDate(new Date('2022 02 11 11:32:00'));
    let end = dateController.createDate(new Date('2022 02 11 17:54:00')); */
    let start = new Date('2022-03-05 12:00:00');
    // start.setHours(12);
    let end = new Date("2022-03-05 13:00:00");
    // end.setHours(13);
    //if (dateController.controlStartEnd(start, end)) {
        let ticket1 = await quaccko.createTicket({ start: start, end: end/* , targa: 'AB123CD' */ });
        let park1 = await Park.findOne({ where: { codeNumber: '3' } });
        await ticket1.setPark(park1);
    //}
    /* let myStart = dateController.createDate(new Date('2022 03 04 13:00:00'));
    let myEnd = dateController.createDate(new Date("2022 03 04 17:00:00")); */
    let myStart = new Date('2022-03-05 15:00:00');
    let myEnd = new Date("2022-03-05 16:00:00");
    let ticket = await quaccko.createTicket({ start: myStart, end: myEnd/* , targa: 'ef555gh' */ });
    let park = await Park.findOne({ where: { codeNumber: '2' } });
    await ticket.setPark(park);
});
//------------------------------------------------------------
//funzioni per aggiornamento periodico
const setAvailability = async () => {
    let parks = await Park.findAll();
    // let now = dateController.createDate(new Date());
    let now = new Date();
    let tickets = await Ticket.findAll({
        where: {
            [db.Sequelize.Op.and]: [
                { start: { [db.Sequelize.Op.lte]: now } },
                { end: { [db.Sequelize.Op.gt]: now } }
            ]
        }
    });
    for (let park of parks) {
        if (tickets.find(t => t.park_id == park.id))
            park.isEmpty = false;
        else park.isEmpty = true;
        await park.save();
    }
}

setInterval(async () => {
    await setAvailability();
}, 1000 * 10);

//----------------------------------------------rest controller api------------------------------------

app.post('/date',(req,res)=>{
    let date = req.body.date;
    date = new Date(date);
    /* date = date.getTime();
    let now = new Date(date);
    date = new Date(date); */
    res.json(date);
})

/**
 * invia i parcheggi
 */
app.get('/parks', async (req, res) => {
    let parks = await Controller.getParksAvailable();
    res.json(parks);
})
/**
 * invia i parcheggi disponibili filtrati per data
 */
 app.post('/parks', async (req, res) => {
    let start = req.body.start;
    let end = req.body.end;
    let parks = await Controller.getParksAvailable();
    if(start && end){
        // let s = dateController.createDate(new Date(start));
        // let e = dateController.createDate(new Date(end));
        let s = new Date(start);
        let e = new Date(end);
        parks = await Controller.getParksAvailable(s,e);
    }
    if(!start&&end) {
        let e = dateController.createDate(new Date(end));
        parks = await Controller.getParksAvailable(new Date(), e);
    }
    if(start&&!end){
        let s = dateController.createDate(new Date(start));
        parks = await Controller.getParksAvailable(s);
    }
    res.json(parks);
})

/**
 * invia i tickets di un utente
 */
app.get('/tickets', auth.authenticateToken ,async (req, res) => {
    let userId = req.user.id;
    let activeTickets = await Controller.getTicketsFiltered(true,userId);
    let pastTickets = await Controller.getTicketsFiltered(false,userId);
    //let tickets = await Controller.getTicketsFiltered(false);
    res.json({activeTickets:activeTickets,pastTickets:pastTickets});
})

/**
 * invia la fine di una prenotazione su un parcheggio corrente
 */
app.post('/park/endTime', async (req, res) => {
    let parkId = req.body.parkId;
    let ticket = await Controller.endOfCurrentReservation(parkId);
    if (!ticket) return res.json('errore');
    return res.json(ticket.end);
})

/**
 * invia la prossima prenotazione su un parcheggio corrente
 */
app.post('/park/next', async (req, res) => {
    let parkId = req.body.parkId;
    let tickets = await Controller.getTicketsFiltered(true);
    tickets = tickets.filter(t=>{return t.park_id == parkId}).sort((t1, t2) => { return t1.start.getTime() - t2.start.getTime() });
    return res.json(tickets);
})

//crea una prenotazione per un parcheggio
app.post('/api/ticket/create',auth.authenticateToken,async(req,res)=>{
    let parkId = req.body.parkId;
    let userId = req.user.id;
    // let targa = req.body.targa;
    let user = await User.findOne({where:{id:userId}});
    let park = await Park.findOne({where:{codeNumber:parkId}});
    let startString = req.body.start;
    let endString = req.body.end;
    let start =  new Date(startString);
    let end =  new Date(endString);
    // if(!dateController.controlStartEnd(start,end)) return res.status(500).json("Not allowed");
    // let ticket = await user.createTicket({start:start,end:end,targa:targa});
    let ticket = await user.createTicket({start:start,end:end});
    await ticket.setPark(park);
    res.json(ticket);
  });

app.post('/park/info',async (req, res) => {
    let parkId = req.body.parkId;
    let park = await Park.findByPk(parkId);
    let location = await park.getLocation();
    let nextTicket = await Controller.getNextTicketOfPark(parkId);
    nextTicket = nextTicket ? dateController.getTimeStringFromDate(nextTicket.start) : 'is empty for the whole day';
/*     nextTicket = dateController.getTimeStringFromDate(nextTicket.start); */
    let ticket = await Controller.endOfCurrentReservation(parkId);
/*     ticket = dateController.getTimeStringFromDate(ticket.end); */
    /* if(!ticket) ticket = 'is free'; */
    ticket = ticket ? dateController.getTimeStringFromDate(ticket.end) : 'is free';
    /* if(!nextTicket) nextTicket = 'is empty for the whole day'; */
    return res.json({end:ticket,next:nextTicket,location:location});
})

/* app.get('/park/info', async (req, res) => {
    let parkId = req.body.parkId;
    let park = await Park.findByPk(parkId);
    let ticket;
    if(park.isEmpty) ticket = await Controller.getNextTicketOfPark(park.id);
    else ticket = await Controller.endOfCurrentReservation(park.id)
    if(!ticket) return res.json('error');
    return res.json({park:park,ticket:ticket});
}) */

//------------------------------authentication-----------------------------------------------

app.post('/auth/registration', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let username = req.body.username;
    if (await User.findOne({ where: { email: email}})|| await User.findOne({ where: { username: username}}))
        res.status(500).send("this account already exists!!");
    else {
      await User.create({ email: email, username: username, password: passManager.generatePass(password) });
      return res.status(201).send("registration completed");
    }
  });
  
  
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
      let accessToken = auth.getAccessToken(user);
      let refreshToken = auth.getRefreshToken(user);
      auth.refreshTokens.push(refreshToken);
      return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    }
    else return res.status(400).send("username or password is not correct");
  });
  
  //TODO: rivedere questo metodo
  app.post("/auth/refresh", (req, res) => {
    let refreshToken = req.body.refreshToken;
    // vede se c'è il refreshToken o se è presente nella lista dei refresh tokens, se non è presente manda errore 401
    if (!refreshToken || !auth.refreshTokens.includes(refreshToken)) return res.status(401).send("You are not authenticated!");
    let user = auth.getUserByRefreshToken(refreshToken);
    //refresha i tokens validi
    auth.refreshTokens = auth.refreshTokens.filter((token) => token !== refreshToken);
    // aggiorna il token ed il refreshToken
    let newAccessToken = auth.getAccessToken(user);
    let newRefreshToken = auth.getRefreshToken(user);
    auth.refreshTokens.push(newRefreshToken);
    //manda in risposta i nuovi tokens
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
  
  //TODO: rivedere questo metodo
  //FIXME: cambiare il meccanismo di cancellazione dei tokens..
  app.post("/auth/logout", auth.authenticateToken, (req, res) => {
    let refreshToken = req.body.refreshToken;
    if(!refreshToken) res.status(400).send('token not present');
    //refresha i tokens
    auth.refreshTokens = auth.refreshTokens.filter((token) => token !== refreshToken);
    //restituisce lo stato 200
    res.status(200).send("You logged out successfully.");
    
  });