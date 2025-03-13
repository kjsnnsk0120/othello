// 石の状態を表す列挙型
enum Piece {
  Empty,
  Black,
  White
}

class OthelloGame {
  board: Piece[][];
  currentPlayer: Piece;
  boardSize: number = 8;

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

  // 現在の盤面状態をもとに、指定座標でひっくり返せる石の一覧を返す
  isValidMove(x: number, y: number, player: Piece): { x: number; y: number }[] {
    if (this.board[x][y] !== Piece.Empty) return [];
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
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
    let toFlip: { x: number; y: number }[] = [];
    for (const { dx, dy } of directions) {
      let nx = x + dx, ny = y + dy;
      let piecesToFlip: { x: number; y: number }[] = [];
      while (this.inBounds(nx, ny) && this.board[nx][ny] === opponent) {
        piecesToFlip.push({ x: nx, y: ny });
        nx += dx;
        ny += dy;
      }
      if (this.inBounds(nx, ny) && this.board[nx][ny] === player && piecesToFlip.length > 0) {
        toFlip = toFlip.concat(piecesToFlip);
      }
    }
    return toFlip;
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

  // 指定プレイヤーの有効な手一覧を返す（現在の盤面）
  getValidMoves(player: Piece): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (this.board[i][j] === Piece.Empty && this.isValidMove(i, j, player).length > 0) {
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

  // ── 以下、評価関数関連 ──

  // (1) 静的評価：マスごとの値を返す
  getStaticValue(i: number, j: number): number {
    if ((i === 0 && j === 0) || (i === 0 && j === 7) ||
        (i === 7 && j === 0) || (i === 7 && j === 7)) {
      return 10000;
    }
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
    
    if ((i === 0 && (j === 2 || j === 5)) ||
        (i === 7 && (j === 2 || j === 5)) ||
        (j === 0 && (i === 2 || i === 5)) ||
        (j === 7 && (i === 2 || i === 5))) {
      return 10;
    }
    if (i === 0 || i === 7 || j === 0 || j === 7) {
      return 5;
    }
    if (2 <= i && i <= 5 && 2 <= j && j <= 5) {
      return 3;
    }
    return -5;
  }

  // (2) 石の安定性：自分の石なら
  //　　- 角は +50
  //　　- エッジ上なら +20
  //　　- それ以外で隣接セルに空があれば -10、なければ +20
  getStability(i: number, j: number, board: Piece[][], player: Piece): number {
    if (board[i][j] !== player) return 0;
    if (i === 0 || i === this.boardSize - 1 || j === 0 || j === this.boardSize - 1) {
      if ((i === 0 && j === 0) || (i === 0 && j === this.boardSize - 1) ||
          (i === this.boardSize - 1 && j === 0) || (i === this.boardSize - 1 && j === this.boardSize - 1)) {
        return 50;
      }
      return 20;
    } else {
      // 隣接セルに空があれば不安定と判断
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          const ni = i + di, nj = j + dj;
          if (this.inBounds(ni, nj) && board[ni][nj] === Piece.Empty) {
            return -10;
          }
        }
      }
      return 20;
    }
  }

  // (3) フロンティア：隣接に空セルがあるなら -5、なければ +10
  getFrontier(i: number, j: number, board: Piece[][], player: Piece): number {
    if (board[i][j] !== player) return 0;
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di, nj = j + dj;
        if (this.inBounds(ni, nj) && board[ni][nj] === Piece.Empty) {
          return -5;
        }
      }
    }
    return 10;
  }

  // (4) 着手可能手数（モビリティ）を、与えられた盤面で計算するための補助関数
  getValidMovesForBoard(board: Piece[][], player: Piece): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === Piece.Empty && this.isValidMoveOnBoard(board, i, j, player).length > 0) {
          moves.push({ x: i, y: j });
        }
      }
    }
    return moves;
  }

  // 盤面指定版の isValidMove
  isValidMoveOnBoard(board: Piece[][], x: number, y: number, player: Piece): { x: number; y: number }[] {
    if (board[x][y] !== Piece.Empty) return [];
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
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
    let toFlip: { x: number; y: number }[] = [];
    for (const { dx, dy } of directions) {
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

  // (5) パリティ：盤面上の空セル数に応じて +50（奇数なら有利）または -50（偶数なら不利）
  getParityScore(board: Piece[][]): number {
    let empty = 0;
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === Piece.Empty) empty++;
      }
    }
    return (empty % 2 === 1) ? 50 : -50;
  }

  // 新たな評価関数：各要素を合算して評価値を算出する
  evaluateBoard(board: Piece[][], player: Piece): number {
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
    let score = 0;
    // (1) 静的評価
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getStaticValue(i, j);
        } else if (board[i][j] === opponent) {
          score -= this.getStaticValue(i, j);
        }
      }
    }
    // (2) 石の安定性
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getStability(i, j, board, player);
        } else if (board[i][j] === opponent) {
          score -= this.getStability(i, j, board, opponent);
        }
      }
    }
    // (3) フロンティア
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (board[i][j] === player) {
          score += this.getFrontier(i, j, board, player);
        } else if (board[i][j] === opponent) {
          score -= this.getFrontier(i, j, board, opponent);
        }
      }
    }
    // (4) モビリティ
    const myMoves = this.getValidMovesForBoard(board, player).length;
    const oppMoves = this.getValidMovesForBoard(board, opponent).length;
    score += (myMoves - oppMoves) * 3;
    // (5) パリティ
    score += this.getParityScore(board);
    return score;
  }

  // 与えられた盤面上で、手 (x, y) を player が打った場合のシミュレーション
  simulateMoveOnBoard(board: Piece[][], x: number, y: number, player: Piece): { newBoard: Piece[][], flipCount: number } {
    let newBoard = board.map(row => row.slice());
    const opponent = player === Piece.Black ? Piece.White : Piece.Black;
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
    let totalFlips: { x: number; y: number }[] = [];
    for (const { dx, dy } of directions) {
      let nx = x + dx, ny = y + dy;
      let flips: { x: number; y: number }[] = [];
      while (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && newBoard[nx][ny] === opponent) {
        flips.push({ x: nx, y: ny });
        nx += dx;
        ny += dy;
      }
      if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize && newBoard[nx][ny] === player && flips.length > 0) {
        totalFlips = totalFlips.concat(flips);
      }
    }
    if (totalFlips.length === 0) return { newBoard, flipCount: 0 };
    newBoard[x][y] = player;
    for (const pos of totalFlips) {
      newBoard[pos.x][pos.y] = player;
    }
    return { newBoard, flipCount: totalFlips.length };
  }

  // コンピュータ用に、最良の手を選ぶ
  // ※序盤（全石数 < 20）の場合、ひっくり返す石数にペナルティ (×3) を加味
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
