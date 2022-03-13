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
 * initializes tables of database in conformity to the definition of model entities
 */
db.sync({ force: true }).then(async () => {
    let informatica = await Location.create({ name: 'A', description: 'polo informatica' });
    for (let index = 1; index < 21; index++) {
        let park = await Park.create({codeNumber: index,info: informatica.name});
        await park.setLocation(informatica);
    }
    let quaccko = await User.create({ email: 'big.quaccko@gmail.com', username: 'big.quaccko', password: passManager.generatePass('ciao') });
    let adminUser = await User.create({ email: 'park.admin@gmail.com', username: 'administrator', password: passManager.generatePass('admin'),isAdmin:true });
    let start = dateController.createDate(13,0);
    let end = dateController.createDate(14,0);
    let ticket1 = await quaccko.createTicket({ start: start, end: end/* , targa: 'AB123CD' */ });
    let ticket3 = await quaccko.createTicket({ start: dateController.createDate(16,0), end: dateController.createDate(16,50)/* , targa: 'AB123CD' */ });
    let ticket2 = await quaccko.createTicket({ start: dateController.createDate(17,0), end: dateController.createDate(18,0)/* , targa: 'AB123CD' */ });
    let park1 = await Park.findOne({ where: { codeNumber: '3' } });
    await ticket1.setPark(park1);
    await ticket2.setPark(park1);
    await ticket3.setPark(park1);
    let myStart =dateController.createDate(15,0);
    let myEnd = dateController.createDate(16,0);
    let ticket = await quaccko.createTicket({ start: myStart, end: myEnd/* , targa: 'ef555gh' */ });
    let park = await Park.findOne({ where: { codeNumber: '2' } });
    await ticket.setPark(park);
});
//--------------------------------------funzioni per aggiornamento periodico-----------------------

/**
 * updates parks in conformity of isEmpty status
 */
const setAvailability = async () => {
    let parks = await Park.findAll();
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
        if (tickets.find(t => t.park_id == park.id)) park.isEmpty = false;
        else park.isEmpty = true;
        await park.save();
    }
}

setInterval(async () => {
    await setAvailability();
}, 1000 * 10);

//----------------------------------------------rest controller api------------------------------------

/**
 * send availables parks in this moment in response
 */
app.get('/parks', async (req, res) => {
    let parks = await Controller.getParksAvailable();
    res.json(parks);
})

/**
 * 
 */
app.post('/parks/parkInfo',auth.authenticateToken,async(req,res)=>{
    let parkId = req.body.parkId;
    let park = await Park.findByPk(parkId);
    if(!parkId) return res.sendStatus(404);
    let parkLocation = await park.getLocation();
    return res.json({park:park,location:parkLocation});
})

/**
 * send parks filtered by date
 */
app.post('/parks', async (req, res) => {
    let start = req.body.start;
    let end = req.body.end;
    let parks = await Controller.getParksAvailable();
    let now = new Date();
    if (start && end) {
        let s = new Date(start);
        let e = new Date(end);
        if(!dateController.startEndCheck(s,e)) return res.sendStatus(500);
        parks = await Controller.getParksAvailable(s, e);
    }
    if (!start && end) {
        let e = new Date(end);
        if(!dateController.startEndCheck(now,e)) return res.sendStatus(500);
        parks = await Controller.getParksAvailable(now, e);
    }
    if (start && !end) {
        let s = new Date(start);
        if(!dateController.checkDate(s)) return res.sendStatus(500);
        parks = await Controller.getParksAvailable(s);
    }
    res.json(parks);
})

/**
 * send user s tickets
 */
app.get('/tickets', auth.authenticateToken, async (req, res) => {
    let userId = req.user.id;
    let activeTickets = await Controller.getTicketsFiltered(true, userId);
    let pastTickets = await Controller.getTicketsFiltered(false, userId);
    res.json({ activeTickets: activeTickets, pastTickets: pastTickets });
})

/**
 * delete an active user s ticket
 */
app.delete('/api/ticket',auth.authenticateToken,async (req, res)=>{
    let userId=req.user.id;
    let ticketId = req.body.ticketId;
    let tickets = await Controller.getTicketsFiltered(true,userId);    
    if(tickets.filter(t=>{t.id===ticketId})){
      await Ticket.destroy({where: {id:ticketId}});
      res.sendStatus(200);
    }
    else res.sendStatus(404);
  })

/**
 * send the end of a reservation for a certain park
 */
app.post('/park/endTime', async (req, res) => {
    let parkId = req.body.parkId;
    let ticket = await Controller.endOfCurrentReservation(parkId);
    if (!ticket) return res.json('errore');
    return res.json(ticket.end);
})

/**
 * send the next reservation for a certain park
 */
app.post('/park/next', async (req, res) => {
    let parkId = req.body.parkId;
    let tickets = await Controller.getTicketsFiltered(true);
    tickets = tickets.filter(t => { return t.park_id == parkId }).sort((t1, t2) => { return t1.start.getTime() - t2.start.getTime() });
    return res.json(tickets);   
})

/**
 * create a ticket for a park
 */
app.post('/api/ticket/create', auth.authenticateToken, async (req, res) => {
    let parkId = req.body.parkId;
    let userId = req.user.id;
    // let targa = req.body.targa;
    let user = await User.findOne({ where: { id: userId } });
    let park = await Park.findOne({ where: { codeNumber: parkId } });
    let startString = req.body.start;
    let endString = req.body.end;
    let start = new Date(startString);
    let end = new Date(endString);
    // if(!dateController.controlStartEnd(start,end)) return res.status(500).json("Not allowed");
    // let ticket = await user.createTicket({start:start,end:end,targa:targa});
    let ticket = await user.createTicket({ start: start, end: end });
    await ticket.setPark(park);
    res.json(ticket);
});

/**
 * send park s info (end of reservation, next reservation and location for a certain park)
 */
app.post('/park/info', async (req, res) => {
    let parkId = req.body.parkId;
    let park = await Park.findByPk(parkId);
    let location = await park.getLocation();
    let nextTicket = await Controller.getNextTicketOfPark(parkId);
    nextTicket = nextTicket ? dateController.getTimeStringFromDate(nextTicket.start) : 'is empty for the whole day';
    let ticket = await Controller.endOfCurrentReservation(parkId);
    ticket = ticket ? dateController.getTimeStringFromDate(ticket.end) : 'is free';
    return res.json({ end: ticket, next: nextTicket, location: location });
})

//------------------------------authentication-----------------------------------------------

app.post('/auth/registration', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let username = req.body.username;
    if (await User.findOne({ where: { email: email } }) || await User.findOne({ where: { username: username } }))
        res.status(500).send("this account already exists!!");
    else {
        await User.create({ email: email, username: username, password: passManager.generatePass(password) });
        return res.status(201).send("registration completed");
    }
});


app.post('/auth/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let isAdmin = req.body.isAdmin;
    let user = await User.findOne({
        where: {
            [db.Sequelize.Op.or]: [
                { username: username },
                { email: username }
            ]
        }
    });
    if (user && passManager.comparePass(password, user.password) && user.isAdmin==isAdmin) {
        let accessToken = auth.getAccessToken(user);
        let refreshToken = auth.getRefreshToken(user);
        auth.refreshTokens.push(refreshToken);
        return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    }
    else return res.status(400).send("username or password is not correct");
});

app.post("/auth/refresh", (req, res) => {
    let refreshToken = req.body.refreshToken;
    // vede se c'è il refreshToken o se è presente nella lista dei refresh tokens,
    //se non è presente manda errore 401
    if (!refreshToken || !auth.refreshTokens.includes(refreshToken))
        return res.status(401).send("You are not authenticated!");
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

app.post("/auth/logout", auth.authenticateToken, (req, res) => {
    let refreshToken = req.body.refreshToken;
    if (!refreshToken) res.status(400).send('token not present');
    //refresha i tokens
    auth.refreshTokens = auth.refreshTokens.filter((token) => token !== refreshToken);
    //restituisce lo stato 200
    res.status(200).send("You logged out successfully.");

});