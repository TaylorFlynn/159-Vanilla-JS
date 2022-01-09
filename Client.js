//HTML elements
let clientId = null;
let gameId = null;
let playerColor = null;
let markType = null;

let ws = new WebSocket("ws://localhost:9090");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");

// Core Variable Identifiers--------------------------------------------------------------------------------
const winningMessageElement = document.getElementById('winningMessage')
const restartButton = document.getElementById('restartButton')
const winningMessageTextElement = document.querySelector('[data-winning-message-text]')
const menus = document.querySelectorAll(".menu")
const nest = document.getElementById("nest")
const node = document.querySelectorAll('.node')
const welcome = document.getElementById('welcome')
const X_CLASS = 'X'
const CIRCLE_CLASS = 'Circle'
const TRI_CLASS = 'Triangle'
const lastMark = 'last'
const Turnlist = [X_CLASS, CIRCLE_CLASS, TRI_CLASS]
let cellElements = document.querySelectorAll('.cell')
let boards = document.querySelectorAll('.board')
let activeCells = document.querySelectorAll('.cell.active')
let numberOfPlayers = 2
let menuIndex = 0
let numberOfBoards = 1
let WINNING_COMBINATIONS
let Win_Pattern
let activeClass
let TurnCount
let local = true
let myTurn = true
let server = true
const cellType = ['one','two','three','four','five','six','seven','eight','nine']

//wiring events
btnJoin.addEventListener("click", (e) => {
  if (gameId === null) gameId = txtGameId.value; 
  const payLoad = {
    method: "join",
    clientId: clientId,
    gameId: gameId,
  };

  if (gameId) ws.send(JSON.stringify(payLoad));
});

btnCreate.addEventListener("click", (e) => {
    if (!local) {
        const payLoad = {
            method: "create",
            clientId: clientId,
            numberOfBoards: numberOfBoards,
            numberOfPlayers: numberOfPlayers
          };
        
          ws.send(JSON.stringify(payLoad));
    }
});

ws.onmessage = (message) => {
  //message.data
  const response = JSON.parse(message.data);
  //connect
  if (response.method === "connect") {
    clientId = response.clientId;
    console.log("Client id Set successfully " + clientId);
  }

  //create
  if (response.method === "create") {
    gameId = response.game._id;
    btnJoin.click()
    console.log(response.game)
    console.log(
      "game successfully created with id " +
        response.game._id +
        " with " +
        response.game.numberOfBoards +
        `${numberOfBoards == 1 ? ' Board' : " Boards"}` +
        " with " +
        response.game.numberOfPlayers + " Players"
    );
  }

  //join
  if (response.method === "join") {
    const game = response.game;
    numberOfBoards = response.game.numberOfBoards
    numberOfPlayers = response.game.numberOfPlayers
    local = false
    welcome.innerText = "ROOM " + gameId

    while (divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

    game.clients.forEach((c) => {
      const d = document.createElement("div");
      d.style.width = "200px";
      d.style.background = c.color;
      d.textContent = c.clientId + " Joined " + gameId;
      divPlayers.appendChild(d);

      if (c.clientId === clientId) playerColor = c.color;
      if (c.clientId === clientId) markType = c.markType;
    });

    while (nest.firstChild) nest.removeChild(nest.firstChild);

    if (numberOfBoards === 9) {
        boardAdvanced()
    } else if (numberOfBoards === 1) {
        boardClassic()
    }
    if (game.clients.length === numberOfPlayers) {
      console.log(response.game)
      server = false
      menus.forEach(menu => menu.classList.remove('show'))
      startGame()
    }
  }

  //place mark
  if (response.method === "play"){
    console.log('payload Received')
    console.log(response.game )

    server = true
    for(const c of Object.keys(response.game.state))
    {
      const cellObject = document.getElementById(c);
      cellObject.click()

    }
    server = false
  }


  if (response.method === "restart") {
    startGame()
  }
};

function SendPlayReq(cell){
    const cellid = cell.id
    const payLoad = {
      method: "play",
      'clientId': clientId,
      "gameId": gameId,
      "cellId": cellid,
      "markType": activeClass
    };
    ws.send(JSON.stringify(payLoad));
}

// Menu Logic--------------------------------------------------------------------------------
menus.forEach(button => {
    button.removeEventListener('click', menuClick)
    button.addEventListener('click', menuClick)
})

function menuClick(e){
    const button = e.target
    if (button.classList.contains('join')){
        menus.forEach(menu => {menu.classList.remove("show")})
        menus[menus.length - 1].classList.add("show")
    }
    if (button.classList.contains('next')){
        menuIndex ++
        goToMenu(menuIndex)
    }
    if (button.classList.contains('host')){
        local = false
    }
    if (button.classList.contains('local')){
        local = true
    }
    if (button.classList.contains('classic')){
        boardClassic()
        menuIndex ++
        goToMenu(menuIndex)
    }
    if (button.classList.contains('advanced')){
        boardAdvanced()
        numberOfBoards = 9
    }
    if (button.classList.contains('two')){
        numberOfPlayers = 2
    }
    if (button.classList.contains('three')){
        numberOfPlayers = 3
    }
    if (button.classList.contains('create')){
        if(local) {
            startGame()
            console.log("local")
            menus.forEach(menu => {menu.classList.remove("show")})
        }
        if (!local) {
            console.log('Hosted')
            menuIndex ++
            goToMenu(menuIndex) 
        }
    }
}

function goToMenu(menuIndex) {
    menus.forEach(menu => {menu.classList.remove("show")})
    menus[menuIndex].classList.add("show")
}

function boardClassic (){
    while (nest.firstChild) nest.removeChild(nest.firstChild);
    for (let i = 0, k = 1; i < 9; i++) {
        c =  document.createElement('div')
        c.classList.add('cell', 'node')
        c.id = 'cell' + (i + 1)
        c.tag = k
        nest.appendChild(c)
    }
    nest.classList.add('board')
    nest.classList.remove('nest')
}

function boardAdvanced (){
    while (nest.firstChild) nest.removeChild(nest.firstChild);
    for (let i = 0, k = 1 ; i < 9; i++) {
        n = document.createElement('div')
        n.classList.add('node')
        nest.appendChild(n)
        b = document.createElement('div')
        b.classList.add('board')
        n.appendChild(b)
        for (let j = 0; j < 9; j++) {
            c =  document.createElement('div')
            c.classList.add('cell', cellType[j])
            c.id = 'cell' + k
            c.tag = k
            b.appendChild(c)
            k++
        }
    }
}

function setComponents() {
    cellElements = document.querySelectorAll('.cell')
    boards = document.querySelectorAll('.board')
}

function setWinCon() {
  WINNING_COMBINATIONS = []
  Win_Pattern = [[0, 1, 2],[3, 4, 5],[6, 7, 8],[0, 3, 6],[1, 4, 7],[2, 5, 8],[0, 4, 8],[2, 4, 6],]
  for (let i = 0; i < boards.length; i++) {
    Win_Pattern.forEach(e => WINNING_COMBINATIONS.push(e));
    Win_Pattern = Win_Pattern.map(item => item.map(item1 => item1 + 9));
  }
}


restartButton.addEventListener('click', restartGame)

startGame()

// Start/Restart Of Game --------------------------------------------------------------------------------


function restartGame() {
  if (!local) {
    const payLoad = { method: "restart", "gameId": gameId};
    ws.send(JSON.stringify(payLoad));
  } else {
    startGame()
  }
}
function startGame() {
  TurnCount = 0 
  setComponents()
  setWinCon()
  setTurn()
  cellElements.forEach(cell => {
    cell.classList.remove(X_CLASS, CIRCLE_CLASS, TRI_CLASS, 'last', 'inactive', 'active')
    cell.classList.add('active')
    cell.removeEventListener('click', handleClick)
    cell.addEventListener('click', handleClick)
  })
  updateActiveCells()
  setActive(boards, 'active', 'inactive')
  winningMessageElement.classList.remove('show')
  setBoardHoverClass()
}

//Turns And Win Logic ----------------------------------------------------------------------------------
function cycleTurns() {
    TurnCount++
    if(TurnCount > numberOfPlayers -1){
        TurnCount = 0
    }
  }

function setTurn() {
  activeClass=Turnlist[TurnCount]
}

function checkWin(activeClass) {
  return WINNING_COMBINATIONS.some(combination => {
    return combination.every(index => {
      return cellElements[index].classList.contains(activeClass)
    })
  })
}


function endGame() {
  if (checkWin(activeClass)) {
    winningMessageTextElement.innerText = `${activeClass}'s  Win!`
  } else if (isDraw()) {
    winningMessageTextElement.innerText = 'Draw!'
  }  else if (isStalemate()) {
    winningMessageTextElement.innerText = 'Stalemate!'
  }
  winningMessageElement.classList.add('show')
}

function isDraw() {
  return [...cellElements].every(cell => {
    return !isEmpty(cell)
  })
}

function isStalemate() {
  return [...activeCells].every(cell => {
    return !isEmpty(cell)
  })
}
// Click Logic, Swap Logic -------------------------------------

function handleClick(e) {
  const cell = e.target
  if (cell.classList.contains('active') && isEmpty(cell)) {
    if(!local && !server){
      SendPlayReq(cell)
      return
    }
    PlaceMark(cell, activeClass,)
    SwapActiveBoard(cell)
    updateActiveCells()
    if (checkWin(activeClass)) {
      endGame()
    } else if (isDraw()) {
      endGame()
    } else if (isStalemate()) {
      endGame()
    }
    cycleTurns()
    setTurn()
    SetLastActive(cell)
    setBoardHoverClass()
  }
}

function updateActiveCells(){
    activeCells = document.querySelectorAll('.cell.active')
}

function isEmpty(cell){
  return !Turnlist.some(turn => cell.classList.contains(turn))
}

function PlaceMark(cell) {
    cell.classList.remove(X_CLASS, CIRCLE_CLASS, TRI_CLASS)
    cell.classList.add(activeClass)
}

function SetLastActive(cell) {
  cellElements.forEach(cell => cell.classList.remove('last'))
  cell.classList.add('last');
}

function setBoardHoverClass() {
  boards.forEach((board) => {
    board.classList.remove(X_CLASS, CIRCLE_CLASS, TRI_CLASS)
    if (board.classList.contains('active') && local) {
      board.classList.add(activeClass)
    } else if (board.classList.contains('active') && !local) {
      board.classList.add(markType)
    }
  })
}

function setActive(selection, added, removed) {
    selection.forEach(s => {
        s.classList.add(added)
        s.classList.remove(removed)
    })
}

function SwapActiveBoard(cell,) {
  for (i = 0; i < boards.length; i++ ) {
    if (cell.classList.contains(cellType[i])) {
      setActive(cellElements, 'inactive', 'active')
      setActive(boards, 'inactive', 'active')
      boards[i].classList.add('active')
      boards[i].classList.remove('inactive')
      setActive(Array.from(boards[i].children), 'active', 'inactive')
    }  
  }
}
