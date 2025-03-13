// 石の状態を表す列挙型
enum Piece {
    Empty,
    Black,
    White
  }
  
  // 評価マトリクス（位置ごとの重み付け）
  // ・四隅は500、隣接する点は低評価、その他の辺や中央は適宜設定
  const evaluationMatrix: number[][] = [
    [500, -20, 10, 5, 5, 10, -20, 500],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [5, -2, 1, 0, 0, 1, -2, 5],
    [5, -2, 1, 0, 0, 1, -2, 5],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [500, -20, 10, 5, 5, 10, -20, 500]
  ];
  
  class OthelloGame {
    board: Piece[][];
    currentPlayer: Piece;
    boardSize: number = 8;
  
    constructor() {
      // 盤面の初期化：8×8の盤を作成しすべて Empty で埋める
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
  
    // 座標 (x, y) が盤面内かどうかを判定
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
  
    // 指定プレイヤーの有効な手一覧を返す
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
  
    // 盤面（board）の状態から、指定プレイヤー視点の評価値を計算する
    // 評価値 = (自分の石の evaluationMatrix の和) － (相手の石の evaluationMatrix の和)
    evaluateBoard(board: Piece[][], player: Piece): number {
      let myScore = 0, oppScore = 0;
      const opponent = player === Piece.Black ? Piece.White : Piece.Black;
      for (let i = 0; i < this.boardSize; i++) {
        for (let j = 0; j < this.boardSize; j++) {
          if (board[i][j] === player) {
            myScore += evaluationMatrix[i][j];
          } else if (board[i][j] === opponent) {
            oppScore += evaluationMatrix[i][j];
          }
        }
      }
      return myScore - oppScore;
    }
  
    // 指定した盤面上で、手 (x, y) を player が打った場合の盤面シミュレーション
    // 戻り値は新しい盤面と、ひっくり返された石の数
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
  
    // コンピュータ（白）が打つべき最良の手を評価関数により選択する
    // 評価値 = (新しい盤面の評価値) - (序盤の場合、ひっくり返す石の数にペナルティ)
    // ※新しい盤面の評価値は「自分の石の evaluationMatrix の和 － 相手の石の evaluationMatrix の和」で計算
    getBestMove(player: Piece): { x: number; y: number } | null {
      const validMoves = this.getValidMoves(player);
      if (validMoves.length === 0) return null;
      let bestScore = -Infinity;
      let bestMove = validMoves[0];
  
      // 現在の盤面での石の合計数で局面の進行度を判断（例：全石数 < 20 なら序盤）
      const totalPieces = this.countPieces().black + this.countPieces().white;
      const earlyGame = totalPieces < 20;
      const penaltyFactor = 3; // 序盤でひっくり返す石が多い手に与えるペナルティ
  
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
  