// ゲームのロジックを担当するクラス

enum Piece {
  Empty,
  Black,
  White
}

class OthelloGame {
  board: Piece[][];
  currentPlayer: Piece;
  boardSize: number = 8;
  // 全メソッドで再利用する方向ベクトル
  private static readonly directions = [
    { dx: -1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 }
  ];

  constructor() {
    // 盤面の初期化：8×8の盤をすべて Empty で埋める
    this.board = Array.from({ length: this.boardSize }, () =>
      Array(this.boardSize).fill(Piece.Empty)
    );
    // 初期配置：中央に2つの黒と2つの白を配置
    this.board[3][3] = Piece.White;
    this.board[3][4] = Piece.Black;
    this.board[4][3] = Piece.Black;
    this.board[4][4] = Piece.White;
    // 最初の手は黒（人間）
    this.currentPlayer = Piece.Black;
  }

  // 座標 (x, y) が盤面内かを判定
  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize;
  }

  // 盤面と座標・プレイヤーを指定して、ひっくり返す対象の石リストを返す共通処理
  private getFlippablePieces(
    board: Piece[][],
    x: number,
    y: number,
    player: Piece
  ): { x: number; y: number }[] {
    if (board[x][y] !== Piece.Empty) return [];
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
    let toFlip: { x: number; y: number }[] = [];
    for (const { dx, dy } of OthelloGame.directions) {
      let nx = x + dx, ny = y + dy;
      let piecesToFlip: { x: number; y: number }[] = [];
      while (this.inBounds(nx, ny) && board[nx][ny] === opponent) {
        piecesToFlip.push({ x: nx, y: ny });
        nx += dx;
        ny += dy;
      }
      if (this.inBounds(nx, ny) && board[nx][ny] === player && piecesToFlip.length > 0) {
        toFlip = toFlip.concat(piecesToFlip);
      }
    }
    return toFlip;
  }

  // 現在の盤面に対して、指定の手が有効ならひっくり返す対象の石リストを返す
  isValidMove(x: number, y: number, player: Piece): { x: number; y: number }[] {
    return this.getFlippablePieces(this.board, x, y, player);
  }

  // 盤面指定版の isValidMove
  isValidMoveOnBoard(board: Piece[][], x: number, y: number, player: Piece): { x: number; y: number }[] {
    return this.getFlippablePieces(board, x, y, player);
  }

  // 実際に手を打って盤面を更新する
  makeMove(x: number, y: number): boolean {
    const piecesToFlip = this.isValidMove(x, y, this.currentPlayer);
    if (piecesToFlip.length === 0) return false;
    this.board[x][y] = this.currentPlayer;
    for (const pos of piecesToFlip) {
      this.board[pos.x][pos.y] = this.currentPlayer;
    }
    // 手を打った後に手番交代
    this.currentPlayer = this.currentPlayer === Piece.Black ? Piece.White : Piece.Black;
    return true;
  }

  // 指定プレイヤーの有効な手一覧を返す
  getValidMoves(player: Piece): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (this.board[i][j] === Piece.Empty && this.getFlippablePieces(this.board, i, j, player).length > 0) {
          moves.push({ x: i, y: j });
        }
      }
    }
    return moves;
  }

  // 盤上の石の数をカウントする
  countPieces(): { black: number; white: number } {
    let black = 0, white = 0;
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (this.board[i][j] === Piece.Black) black++;
        else if (this.board[i][j] === Piece.White) white++;
      }
    }
    return { black, white };
  }

  // 両プレイヤーともに有効な手がなければゲーム終了
  isGameOver(): boolean {
    return this.getValidMoves(Piece.Black).length === 0 && this.getValidMoves(Piece.White).length === 0;
  }

  // 以下、評価関数など
  getStaticValue(i: number, j: number): number {
    if ((i === 0 && j === 0) || (i === 0 && j === 7) ||
        (i === 7 && j === 0) || (i === 7 && j === 7)) {
      return 10000;
    }
    // XおよびCの評価値を下げる。ただし隅がすでにとられている場合はその限りではない。
    if (this.board[0][0] === Piece.Empty){
      if(i === 1 && j === 1){
        return -700;
      }
      if ((i === 0 && j === 1) || (i === 1 && j === 0)) {
        return -500;
      }
    }
    if (this.board[0][7] === Piece.Empty){
      if(i === 1 && j === 6){
        return -700;
      }
      if ((i === 0 && j === 6) || (i === 1 && j === 7)) {
        return -500;
      }
    }
    if (this.board[7][0] === Piece.Empty){
      if(i === 6 && j === 1){
        return -700;
      }
      if ((i === 6 && j === 0) || (i === 7 && j === 1)) {
        return -500;
      }
    }
    if (this.board[7][7] === Piece.Empty){
      if(i === 6 && j === 6){
        return -700;
      }
      if ((i === 6 && j === 7) || (i === 7 && j === 6)) {
        return -500;
      }
    }

    if (i === 0 || i === 7 || j === 0 || j === 7) {
      return 10;
    }
    if (2 <= i && i <= 5 && 2 <= j && j <= 5) {
      return 3;
    }
    return -5;
  }

  getStability(i: number, j: number, board: Piece[][], player: Piece): number {
    if (board[i][j] !== player) return 0;
    if (i === 0 || i === this.boardSize - 1 || j === 0 || j === this.boardSize - 1) {
      if ((i === 0 && j === 0) || (i === 0 && j === this.boardSize - 1) ||
          (i === this.boardSize - 1 && j === 0) || (i === this.boardSize - 1 && j === this.boardSize - 1)) {
        return 50;
      }
      return 20;
    }
    for (const { dx, dy } of OthelloGame.directions) {
      const ni = i + dx, nj = j + dy;
      if (this.inBounds(ni, nj) && board[ni][nj] === Piece.Empty) {
        return -10;
      }
    }
    return 20;
  }

  getFrontier(i: number, j: number, board: Piece[][], player: Piece): number {
    if (board[i][j] !== player) return 0;
    for (const { dx, dy } of OthelloGame.directions) {
      const ni = i + dx, nj = j + dy;
      if (this.inBounds(ni, nj) && board[ni][nj] === Piece.Empty) {
        return -5;
      }
    }
    return 10;
  }

  getValidMovesForBoard(board: Piece[][], player: Piece): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === Piece.Empty && this.getFlippablePieces(board, i, j, player).length > 0) {
          moves.push({ x: i, y: j });
        }
      }
    }
    return moves;
  }

  getParityScore(board: Piece[][]): number {
    let empty = 0;
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === Piece.Empty) empty++;
      }
    }
    return (empty % 2 === 1) ? 50 : -50;
  }

  evaluateBoard(board: Piece[][], player: Piece): number {
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
    let score = 0;
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getStaticValue(i, j);
        } else if (board[i][j] === opponent) {
          score -= this.getStaticValue(i, j);
        }
      }
    }
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getStability(i, j, board, player);
        } else if (board[i][j] === opponent) {
          score -= this.getStability(i, j, board, opponent);
        }
      }
    }
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getFrontier(i, j, board, player);
        } else if (board[i][j] === opponent) {
          score -= this.getFrontier(i, j, board, opponent);
        }
      }
    }
    const myMoves = this.getValidMovesForBoard(board, player).length;
    const oppMoves = this.getValidMovesForBoard(board, opponent).length;
    score += (myMoves - oppMoves) * 3;
    score += this.getParityScore(board);
    return score;
  }

  simulateMoveOnBoard(board: Piece[][], x: number, y: number, player: Piece): { newBoard: Piece[][], flipCount: number } {
    const newBoard = board.map(row => row.slice());
    const flips = this.getFlippablePieces(newBoard, x, y, player);
    if (flips.length === 0) return { newBoard, flipCount: 0 };
    newBoard[x][y] = player;
    for (const pos of flips) {
      newBoard[pos.x][pos.y] = player;
    }
    return { newBoard, flipCount: flips.length };
  }

  getBestMove(player: Piece): { x: number; y: number } | null {
    const validMoves = this.getValidMoves(player);
    if (validMoves.length === 0) return null;
    let bestScore = -Infinity;
    let bestMove = validMoves[0];
    const totalPieces = this.countPieces().black + this.countPieces().white;
    const earlyGame = totalPieces < 20;
    const penaltyFactor = 3;
    for (const move of validMoves) {
      const { newBoard, flipCount } = this.simulateMoveOnBoard(this.board, move.x, move.y, player);
      let score = this.evaluateBoard(newBoard, player);
      if (earlyGame) {
        score -= flipCount * penaltyFactor;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }
}

// UI関連の処理（レンダリング、イベントハンドリング、ターン管理など）をまとめたクラス
class OthelloUI {
  private game: OthelloGame;
  private boardElement: HTMLElement;
  private turnElement: HTMLElement;

  constructor() {
    this.game = new OthelloGame();
    const boardEl = document.getElementById("board");
    const turnEl = document.getElementById("turn");
    if (!boardEl || !turnEl) {
      throw new Error("Board または Turn 要素が見つかりません。");
    }
    this.boardElement = boardEl;
    this.turnElement = turnEl;
  }

  public start(): void {
    this.renderBoard();
    this.updateTurnDisplay();
    // コンピュータの手番なら最初から処理開始
    if (this.game.currentPlayer === Piece.White) {
      this.computerMove();
    }
  }

  private updateTurnDisplay(): void {
    const current = this.game.currentPlayer === Piece.Black ? "黒（人間）" : "白（コンピュータ）";
    this.turnElement.innerText = `現在の手番: ${current}`;
  }

  private checkGameOver(): boolean {
    const { black, white } = this.game.countPieces();
    const total = black + white;
    if (this.game.isGameOver() || total === this.game.boardSize * this.game.boardSize) {
      const msg = `ゲーム終了！ 黒: ${black}、白: ${white}`;
      console.log(msg);
      alert(msg);
      return true;
    }
    return false;
  }

  private advanceTurn(): void {
    setTimeout(() => {
      if (this.checkGameOver()) return;
      if (this.game.getValidMoves(this.game.currentPlayer).length === 0) {
        const msg = `${this.game.currentPlayer === Piece.Black ? "黒" : "白"}は打てる手がありません。パスします。`;
        console.log(msg);
        alert(msg);
        this.game.currentPlayer = this.game.currentPlayer === Piece.Black ? Piece.White : Piece.Black;
        this.renderBoard();
        this.updateTurnDisplay();
        this.advanceTurn();
      } else if (this.game.currentPlayer === Piece.White) {
        setTimeout(() => {
          this.computerMove();
        }, 500);
      }
    }, 50);
  }

  private renderBoard(): void {
    this.boardElement.innerHTML = "";
    for (let i = 0; i < this.game.boardSize; i++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row";
      for (let j = 0; j < this.game.boardSize; j++) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";
        cellDiv.dataset.x = i.toString();
        cellDiv.dataset.y = j.toString();
        const piece = this.game.board[i][j];
        if (piece === Piece.Black || piece === Piece.White) {
          const stone = document.createElement("div");
          stone.className = "stone";
          stone.style.backgroundColor = piece === Piece.Black ? "black" : "white";
          cellDiv.appendChild(stone);
        }
        if (this.game.currentPlayer === Piece.Black && piece === Piece.Empty) {
          cellDiv.addEventListener("click", () => {
            if (this.game.makeMove(i, j)) {
              this.renderBoard();
              this.updateTurnDisplay();
              this.advanceTurn();
            }
          });
        }
        rowDiv.appendChild(cellDiv);
      }
      this.boardElement.appendChild(rowDiv);
    }
  }

  private computerMove(): void {
    if (this.game.currentPlayer !== Piece.White) return;
    const bestMove = this.game.getBestMove(Piece.White);
    if (bestMove) {
      this.game.makeMove(bestMove.x, bestMove.y);
    } else {
      this.game.currentPlayer = Piece.Black;
    }
    this.renderBoard();
    this.updateTurnDisplay();
    this.advanceTurn();
  }
}
