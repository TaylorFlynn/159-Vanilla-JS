const http = require("http");
const app = require("express")();
const websocketServer = require("websocket").server
const mongoose = require('mongoose');
const Game = require('./DatabaseModels/gameState')
const PORT = process.env.PORT || 9091

//Hashmap Clients
const connections = new Map();


const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/159'
mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

app.get("/", (req,res)=> res.sendFile(__dirname + "/test.html"))
app.get("/test.css", (req,res)=> res.sendFile(__dirname + "/test.css"))
app.get("/Client.js", (req,res)=> res.sendFile(__dirname + "/Client.js"))  
app.get(`/:lobby`, (req,res)=> res.sendFile(__dirname + `/test.html`))

const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Http Listening on port 9090"))
app.listen(PORT, ()=>console.log(`App Listening on Port: ${PORT}`))

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    const clientId = guid()
    connection.clientId = clientId
    connections.set(clientId, connection)
    const payLoad = {
        "method": "connect",
        "clientId" : clientId
    }
    connection.send(JSON.stringify(payLoad))
    // console.log(wsServer.connections)

    
    connection.on("open", () => console.log("opened!") )
    connection.on("close", async function () {
        const leaver = connection.clientId
        const lobby = connection.gameId
        if(lobby) {
            const game = await Game.findById(lobby)
            game.clients = game.clients.filter(c => c.clientId !== leaver)
            console.log(`${leaver} Closed Connection`)
            await game.save()
            if (game.clients.length === 0) {
                await Game.findByIdAndDelete(lobby);
                console.log(`Closed Lobby ${lobby}`)
            } 
        } else console.log(`${leaver} Closed Connection`)
    })
    connection.on("message", message => {
        const result  = JSON.parse(message.utf8Data)
        // I have received a message from the client

        // A User Wants To Create A Game
        if (result.method === "create"){
            const clientId = result.clientId
            const gameId = S4().toUpperCase()

            generate = async () => {
                const game = new Game()
                game._id = gameId
                game.clients = []
                game.numberOfBoards = result.numberOfBoards
                game.numberOfPlayers = result.numberOfPlayers
                game.state = {}
                game.activePlayer = 0
                await game.save()

                const payLoad = {
                    "method": "create",
                    "game": game
                }

                const recipients = connections.get(clientId);
                recipients.send(JSON.stringify(payLoad))
            }
            generate()
        }

        // A User Wants To Join A Game
        if (result.method === "join"){
            console.log("A User Wants to Join")

            join = async () => {
                const clientId = result.clientId;
                const gameId = result.gameId;
                connection.gameId = gameId
                const game = await Game.findById(gameId)
                if (game.clients.length >= game.numberOfPlayers) return;

                const color = {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]
                const markType = {"0": "X", "1": "Circle", "2": "Triangle"}[game.clients.length]



                game.clients.push({
                    "clientId": clientId,
                    "color": color,
                    "markType": markType
                })

                const payLoad = {
                    "method": "join",
                    "game": game,
                }

                 //Loop through all clients, inform Join
                game.clients.forEach(c =>{
                    const recipients = connections.get(c.clientId);
                    recipients.send(JSON.stringify(payLoad))
                })

                game.save()
            }
            join()
            
        }

        // A User Wants To Make A Move
        if (result.method === "play") {
            console.log('play request')
            play = async () => {
                const gameId = result.gameId
                const clientId = result.clientId
                const cellId = result.cellId
                const markType = result.markType
                const game = await Game.findById(gameId)
                if (game.numberOfPlayers !== game.clients.length) return;
                if(clientId !== game.clients[game.activePlayer].clientId) return;
                game.state[cellId] = markType
                game.markModified('state')
                game.activePlayer++
                if (game.activePlayer >= game.clients.length) game.activePlayer = 0

                const payLoad = {
                    "method": "play",
                    "game": game,
                }

                game.clients.forEach(c =>{
                    connections.get(c.clientId).send(JSON.stringify(payLoad))
                })

                game.save()
            }
            play()
            
        }
        
        // A User Wants To Restart The Game
        if (result.method === "restart") {

            restart = async () => {
                const gameId = result.gameId
                const game = await Game.findById(gameId)
                game.state = {}
                game.activePlayer = 0
                const payLoad = {
                    "method": "restart",
                    "game": game
                }
                game.clients.forEach(c =>{
                    connections.get(c.clientId).send(JSON.stringify(payLoad))
                })

                game.save()
            }

            restart()
        }
    })
})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
