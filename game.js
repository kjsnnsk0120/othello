"use strict";
var Cell;
(function (Cell) {
    Cell[Cell["Empty"] = 0] = "Empty";
    Cell[Cell["Black"] = 1] = "Black";
    Cell[Cell["White"] = 2] = "White"; // コンピュータ（白）
})(Cell || (Cell = {}));
const BOARD_SIZE = 8;
// 盤面（8x8の2次元配列）を初期化
let board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Cell.Empty));
// 初期配置
board[3][3] = Cell.White;
board[3][4] = Cell.Black;
board[4][3] = Cell.Black;
board[4][4] = Cell.White;
// 現在の手番（初手は黒＝プレイヤー）
let currentPlayer = Cell.Black;
const directions = [
    { dx: -1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }
];
// HTMLのボードを描画する
function renderBoard() {
    const boardTable = document.getElementById("board");
    boardTable.innerHTML = "";
    for (let y = 0; y < BOARD_SIZE; y++) {
        const tr = document.createElement("tr");
        for (let x = 0; x < BOARD_SIZE; x++) {
            const td = document.createElement("td");
            td.dataset.x = x.toString();
            td.dataset.y = y.toString();
            td.addEventListener("click", onCellClick);
            // 盤面に石がある場合はdivを生成
            if (board[y][x] !== Cell.Empty) {
                const stone = document.createElement("div");
                stone.classList.add("stone");
                if (board[y][x] === Cell.Black) {
                    stone.classList.add("black");
                }
                else if (board[y][x] === Cell.White) {
                    stone.classList.add("white");
                }
                td.appendChild(stone);
            }
            tr.appendChild(td);
        }
        boardTable.appendChild(tr);
    }
    updateMessage();
}
// メッセージ表示
function updateMessage(message) {
    const msgDiv = document.getElementById("message");
    if (message) {
        msgDiv.textContent = message;
    }
    else {
        msgDiv.textContent = currentPlayer === Cell.Black ? "あなた（黒）の手番です" : "コンピュータ（白）の手番です";
    }
}
// 指定セルが盤内かどうかのチェック
function isInside(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}
// 指定セル(x,y)にcolorの石を置いた場合の裏返し可能な石リストを取得する
function getFlippableStones(x, y, color) {
    const opponent = (color === Cell.Black) ? Cell.White : Cell.Black;
    const stonesToFlip = [];
    if (board[y][x] !== Cell.Empty)
        return [];
    // 各方向について探索
    for (const dir of directions) {
        let nx = x + dir.dx;
        let ny = y + dir.dy;
        const stonesInDirection = [];
        // まずは隣接セルが相手の石でなければならない
        if (!isInside(nx, ny) || board[ny][nx] !== opponent)
            continue;
        // 相手の石が続く間探索
        while (isInside(nx, ny) && board[ny][nx] === opponent) {
            stonesInDirection.push({ x: nx, y: ny });
            nx += dir.dx;
            ny += dir.dy;
        }
        // その先に自分の石があるなら有効
        if (isInside(nx, ny) && board[ny][nx] === color) {
            stonesToFlip.push(...stonesInDirection);
        }
    }
    return stonesToFlip;
}
// 指定の位置に色を置けるかチェック
function isValidMove(x, y, color) {
    return getFlippableStones(x, y, color).length > 0;
}
// 合法手の一覧を返す
function getValidMoves(color) {
    const moves = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (isValidMove(x, y, color)) {
                moves.push({ x, y });
            }
        }
    }
    return moves;
}
// 指定セルに石を置き、必要な石を反転する
function makeMove(x, y, color) {
    if (!isValidMove(x, y, color))
        return false;
    // 石を置く
    board[y][x] = color;
    // 裏返す石のリストを取得して反転
    const stonesToFlip = getFlippableStones(x, y, color);
    for (const pos of stonesToFlip) {
        board[pos.y][pos.x] = color;
    }
    return true;
}
// プレイヤーがセルをクリックした際の処理
function onCellClick(event) {
    if (currentPlayer !== Cell.Black)
        return; // プレイヤーの手番でない場合は無視
    const target = event.currentTarget;
    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    if (makeMove(x, y, Cell.Black)) {
        renderBoard();
        nextTurn();
    }
    else {
        updateMessage("そこには置けません");
    }
}
// 次の手番に移行する処理（合法手がない場合のパス処理を含む）
function nextTurn() {
    // プレイヤー交代
    currentPlayer = (currentPlayer === Cell.Black) ? Cell.White : Cell.Black;
    // 現在の手番の合法手をチェック
    const validMoves = getValidMoves(currentPlayer);
    if (validMoves.length === 0) {
        // 合法手がない場合はパス
        updateMessage((currentPlayer === Cell.Black ? "あなた" : "コンピュータ") + "は打てる場所がありません。パスします。");
        // 交代してもう一度チェック
        currentPlayer = (currentPlayer === Cell.Black) ? Cell.White : Cell.Black;
        if (getValidMoves(currentPlayer).length === 0) {
            // 両者とも打てないならゲーム終了
            gameOver();
            return;
        }
        // パス後、コンピュータの手番の場合はすぐに処理
        if (currentPlayer === Cell.White) {
            setTimeout(computerMove, 1000);
        }
        return;
    }
    // コンピュータの手番なら処理を呼び出す
    if (currentPlayer === Cell.White) {
        setTimeout(computerMove, 1000);
    }
    else {
        updateMessage();
    }
}
// ゲーム終了時の処理：得点計算など
function gameOver() {
    let blackCount = 0;
    let whiteCount = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === Cell.Black)
                blackCount++;
            else if (board[y][x] === Cell.White)
                whiteCount++;
        }
    }
    let result = `ゲーム終了！ 黒: ${blackCount}、白: ${whiteCount}。`;
    if (blackCount > whiteCount)
        result += "あなたの勝ちです！";
    else if (whiteCount > blackCount)
        result += "コンピュータの勝ちです！";
    else
        result += "引き分けです！";
    updateMessage(result);
}
// コンピュータ（白）の手を決定する処理（現状はランダムに合法手を選ぶ）
function computerMove() {
    // 将来的に高度なアルゴリズムに変更できるよう、別メソッドとして実装
    const validMoves = getValidMoves(Cell.White);
    if (validMoves.length === 0) {
        // コンピュータは置けないため、次の手番へ
        nextTurn();
        return;
    }
    // ランダムに合法手から選択
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    makeMove(move.x, move.y, Cell.White);
    renderBoard();
    nextTurn();
}
// 初回の描画
renderBoard();
