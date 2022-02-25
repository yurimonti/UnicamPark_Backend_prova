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
    let start = dateController.createDate(new Date('2022 02 11 11:32:00'));
    let end = dateController.createDate(new Date('2022 02 11 17:54:00'));
    if (dateController.controlStartEnd(start, end)) {
        let ticket = await quaccko.createTicket({ start: start, end: end, targa: 'AB123CD' });
        let park = await Park.findOne({ where: { codeNumber: '3' } });
        await ticket.setPark(park);
    }
    let myStart = dateController.createDate(new Date('2022 02 25 16:00:00'));
    let myEnd = dateController.createDate(new Date("2022 02 25 17:00:00"));
    let ticket = await quaccko.createTicket({ start: myStart, end: myEnd, targa: 'ef555gh' });
    let park = await Park.findOne({ where: { codeNumber: '3' } });
    await ticket.setPark(park);
});
//------------------------------------------------------------
//funzioni per aggiornamento periodico
const setAvailability = async () => {
    let parks = await Park.findAll();
    let now = dateController.createDate(new Date());
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
}, 1000 * 60 * 2);

//------------------------------funzioni utili-----------------------------------------------



//----------------------------------------------rest controller api------------------------------------
/**
 * invia i parcheggi
 */
app.get('/parks', async (req, res) => {
    let start = dateController.createDate(new Date("2022 02 25 17:30:00"));
    let end = dateController.createDate(new Date("2022 02 25 18:00:00"));
    let parks = await Controller.getParksAvailable(start, end);
    res.json(parks);
})

/**
 * invia i tickets attivi
 */
app.get('/tickets', async (req, res) => {
    let tickets = await Controller.getTicketsFiltered(true);
    res.json(tickets);
})

/**
 * invia la fine di una prenotazione su un parcheggio corrente
 */
app.get('/park/endTime', async (req, res) => {
    let ticket = await Controller.endOfCurrentReservation(3);
    if (!ticket) return res.json('errore');
    return res.json(ticket.end);
})

/**
 * invia la prossima prenotazione su un parcheggio corrente
 */
app.get('/park/next', async (req, res) => {
    let ticket = await Controller.getNextTicketOfPark(3);
    if (!ticket) return res.json('errore');
    return res.json(ticket.start);
})

//TODO: finire questo metodo
app.get('/park/info', async (req, res) => {

})