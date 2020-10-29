let finished = false;
const boardLength = 3;
let catSound;
let dogSound;

let p1;
let p2;
let currentPlayer;
let playerBoxes;
let boxes;
let socket;

window.onload = init;

function init() {
    console.log("init");
    playerBoxes = [...document.getElementById("players").children];
    boxes = [...document.getElementById("game-board").children];
    boxes.forEach((child, i) => {
        child.addEventListener("click", sendMove);
        child.dataset.row = Math.floor(i / 3);
        child.dataset.col = i % 3;
        child.dataset.index = i;
        // child.textContent = (Math.floor(i / 3) + 1) + " " + (i % 3 + 1); 
    });

    catSound = new Sound("./meow.mp3");
    dogSound = new Sound("./doggie.mp3");

    socket = io();

    socket.on("player", _player => {
        console.log("player", _player);
        p1 = _player;
        currentPlayer = p1 % 2 === 0;
    
        const playerName = prompt("Enter player name: ");
        const playerData = {
            player: p1,
            playerName
        };
        drawPlayerName(playerData, 0);
        socket.emit("playerName", playerData);
    });
    
    socket.on("playerName", data => {
        console.log(data);
        if (!p2) {
            p2 = data.player;
            drawPlayerName(data, 1);
        }
    });
    
    function drawPlayerName(data, idx) {
        playerBoxes[idx].innerHTML = data.playerName;
        if (data.player % 2 === 0) {
            playerBoxes[idx].classList.add("active-player");
        }
    }
    
    socket.on("move", move => {
        console.log(move);
        currentPlayer = !currentPlayer;
        playerBoxes.forEach(box => {
            if (box.classList.contains("active-player")) {
                box.classList.remove("active-player");
            } else {
                box.classList.add("active-player");
            }
        })
        drawShape(move);
    });
}

function sendMove(event) {
    const cell = event.target;
    if (cell.innerHTML === "" && currentPlayer) {
        socket.emit("move", {
            movedPlayer: p1,
            cellIndex: cell.dataset.index
        });
    }
}

function drawShape({ movedPlayer, cellIndex }) {
    if (!finished) {
        const cell = boxes[cellIndex];
        if (movedPlayer % 2 === 0) {
            cell.innerHTML = `<i class="fas fa-cat piece"></i>`;
            cell.dataset.type = 0;
            catSound.play();
        } else {
            cell.innerHTML = `<i class="fas fa-dog piece"></i>`;
            cell.dataset.type = 1;
            dogSound.play();
        }
        // checkWinner();
        checkWinner2();
    }
}

function checkWinner() {
    const catSet = [...document.getElementById("game-board").children]
        .filter(elem => elem.dataset.type == 0);
    const dogSet = [...document.getElementById("game-board").children]
        .filter(elem => elem.dataset.type == 1);

    const check = arr => {
        for (let i = 0; i < boardLength; i++) {
            const lines = [[], [], [], []];
            arr.forEach(elem => {
                if (elem.dataset.row == i) {
                    lines[0].push(elem);
                }
                if (elem.dataset.col == i) {
                    lines[1].push(elem);
                }
                if (elem.dataset.row == elem.dataset.col) {
                    lines[2].push(elem);
                }
                if (elem.dataset.row == (boardLength - 1 - elem.dataset.col)) {
                    lines[3].push(elem);
                }
            });

            const foundLines = lines.map(list => list.length === boardLength);

            if (foundLines.includes(true)) {
                drawWinner(lines[foundLines.indexOf(true)]);
            }
        }

        return false;
    }

    check(catSet);
    check(dogSet);

    function drawWinner(boxList) {
        boxList.forEach(element => {
            element.classList.add("winner")
        });
    }
}

function checkWinner2() {
    const children = [...document.getElementById("game-board").children];
    const catSet = children.filter(elem => elem.dataset.type == 0)
        .map(elem => elem.dataset.row + elem.dataset.col);
    const dogSet = children.filter(elem => elem.dataset.type == 1)
        .map(elem => elem.dataset.row + elem.dataset.col);

    const lines = [
        ["00", "01", "02"],
        ["10", "11", "12"],
        ["20", "21", "22"],
        ["00", "10", "20"],
        ["01", "11", "21"],
        ["02", "12", "22"],
        ["00", "11", "22"],
        ["02", "11", "20"]
    ];

    let foundLine;
    let winner;

    lines.forEach(line => {
        let matches = 0;

        checkPlayer(catSet, 0)
        checkPlayer(dogSet, 1)

        function checkPlayer(arr, type) {
            matches = 0;
            arr.forEach(cat => {
                if (line.includes(cat)) {
                    matches++;
                }
            })
            if (matches === 3) {
                winner = type;
                foundLine = line;
            }
        }
    });

    if (foundLine) {
        finished = true;
        foundLine.forEach(box => {
            const childIndex = box[0] * 3 + box[1] * 1;
            children[childIndex].classList.add("winner");
        });

        for (let i = 1; i < 3; i++) {
            setTimeout(() => {
                if (winner === 0) {
                    catSound.play();
                } else {
                    dogSound.play();
                }
            }, i * 800);
        }
    }
}

function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    }
    this.stop = function () {
        this.sound.pause();
    }
}
