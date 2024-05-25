const width = 300;
const height = 300;
const boardSize = 3;
const cellSize = width / boardSize;

// Initialize game board
let board = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];

// Create SVG container for the game board
const svgBoard = d3.select("#game-board")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Create SVG container for the game tree
const svgTree = d3.select("#game-tree")
  .append("svg")
  .attr("width", 2000) // Adjust width as needed
  .attr("height", 2000); // Adjust height as needed

let treeDataRoot; // Store the root of the tree data for easy access
let i = 0; // Node counter

// Draw the game board
const drawBoard = () => {
  svgBoard.selectAll("rect").remove();
  svgBoard.selectAll("text").remove();

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      svgBoard.append("rect")
        .attr("x", i * cellSize)
        .attr("y", j * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", "white")
        .attr("stroke", "black")
        .on("click", () => makeMove(i, j, 'X'));

      if (board[i][j] !== '') {
        renderMove(i, j, board[i][j]);
      }
    }
  }
};

// Render a move
const renderMove = (x, y, player) => {
  svgBoard.append("text")
    .attr("x", x * cellSize + cellSize / 2)
    .attr("y", y * cellSize + cellSize / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("font-size", "48px")
    .text(player);
};

// Render Minimax score
const renderScore = (x, y, score) => {
  svgBoard.append("text")
    .attr("x", x * cellSize + cellSize / 2)
    .attr("y", y * cellSize + cellSize / 2 + 30)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", "red")
    .text(score);
};

// Check for a win or draw
const checkWin = (board, player) => {
  // Check rows, columns, and diagonals
  for (let i = 0; i < boardSize; i++) {
    if (board[i].every(cell => cell === player)) return true;
    if (board.every(row => row[i] === player)) return true;
  }
  if (board.every((row, i) => row[i] === player)) return true;
  if (board.every((row, i) => row[boardSize - 1 - i] === player)) return true;
  return false;
};

const isDraw = board => board.flat().every(cell => cell !== '');

// Make a move and update the board
const makeMove = (x, y, player) => {
  if (board[x][y] === '') {
    board[x][y] = player;
    drawBoard();
    if (checkWin(board, player)) {
      setTimeout(() => alert(`${player} wins!`), 100);
      setTimeout(resetGame, 200);
    } else if (isDraw(board)) {
      setTimeout(() => alert("It's a draw!"), 100);
      setTimeout(resetGame, 200);
    } else {
      if (player === 'X') {
        setTimeout(() => {
          const [aiX, aiY] = findBestMove();
          makeMove(aiX, aiY, 'O');
        }, 500); // Delay to show AI move
      }
    }
  }
};

// Minimax algorithm to find the best move for AI
const minimax = (board, depth, isMaximizing) => {
  if (checkWin(board, 'X')) return -10 + depth;
  if (checkWin(board, 'O')) return 10 - depth;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'O';
          let score = minimax(board, depth + 1, false);
          board[i][j] = '';
          if (score > bestScore) {
            bestScore = score;
          }
          renderScore(i, j, score); // Visualize score
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'X';
          let score = minimax(board, depth + 1, true);
          board[i][j] = '';
          if (score < bestScore) {
            bestScore = score;
          }
          renderScore(i, j, score); // Visualize score
        }
      }
    }
    return bestScore;
  }
};

// Helper function to create tree data
const createTreeData = (board, depth, isMaximizing) => {
  const node = {
    id: ++i,
    board: JSON.parse(JSON.stringify(board)),
    move: null,
    player: isMaximizing ? 'O' : 'X',
    children: []
  };

  if (checkWin(board, 'X')) {
    node.score = -10 + depth;
  } else if (checkWin(board, 'O')) {
    node.score = 10 - depth;
  } else if (isDraw(board)) {
    node.score = 0;
  } else {
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === '') {
          board[i][j] = node.player;
          const child = createTreeData(board, depth + 1, !isMaximizing);
          child.move = `${i},${j}`;
          node.children.push(child);
          board[i][j] = '';
        }
      }
    }
  }
  return node;
};

// Toggle children on click
const toggleChildren = d => {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  updateTree(d);
};

// Visualize the game tree
const drawTree = (treeData) => {
  svgTree.selectAll("*").remove();

  treeDataRoot = d3.hierarchy(treeData);
  treeDataRoot.x0 = 900;
  treeDataRoot.y0 = 0;

  const treeLayout = d3.tree().size([1800, 1800]); // Adjust size as needed
  treeLayout(treeDataRoot);

  updateTree(treeDataRoot);
};

// Update the tree
const updateTree = source => {
  const treeLayout = d3.tree().size([1800, 1800]);
  treeLayout(treeDataRoot);

  const nodes = treeDataRoot.descendants();
  const links = treeDataRoot.links();

  // Draw links
  const link = svgTree.selectAll("line")
    .data(links, d => d.target.id);

  link.enter().append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "black");

  link.transition()
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  link.exit().remove();

  // Draw nodes
  const node = svgTree.selectAll("circle")
    .data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 20)
    .attr("fill", d => d.data.player === 'X' ? "blue" : "green")
    .on("click", toggleChildren);

  nodeEnter.merge(node).transition()
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  node.exit().remove();

  // Add text
  const text = svgTree.selectAll("text")
    .data(nodes, d => d.id || (d.id = ++i));

  const textEnter = text.enter().append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "white")
    .text(d => d.data.move);

  textEnter.merge(text).transition()
    .attr("x", d => d.x)
    .attr("y", d => d.y - 10);

  text.exit().remove();
};

// Find the best move for AI
const findBestMove = () => {
  const treeData = createTreeData(board, 0, true);
  drawTree(treeData);

  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === '') {
        board[i][j] = 'O';
        let score = minimax(board, 0, false);
        board[i][j] = '';
        if (score > bestScore) {
          bestScore = score;
          move = [i, j];
        }
      }
    }
  }
  return move;
};

// Reset the game
const resetGame = () => {
  board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];
  drawBoard();
  drawTree({});
};

// Adjust the height of the game tree container
const adjustGameTreeContainerHeight = () => {
  const gameTreeContainer = document.getElementById('game-tree-container');
  gameTreeContainer.style.height = `${window.innerHeight}px`;
};

// Initialize the game
resetGame();
drawBoard();
drawTree({});
adjustGameTreeContainerHeight();

// Adjust the game tree container height on window resize
window.addEventListener('resize', adjustGameTreeContainerHeight);
