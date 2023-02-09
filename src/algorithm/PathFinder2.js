class PriorityQueue {
    constructor() {
        this.nodes = [];
    }

    add(node) {
        this.nodes.push(node);
        this.nodes.sort((a, b) => a.fScore - b.fScore);
    }

    isEmpty() {
        return this.nodes.length === 0;
    }

    getNext() {
        return this.nodes.shift();
    }

    remove(node) {
        const index = this.nodes.indexOf(node);
        this.nodes.splice(index, 1);
    }
}

function pathfinder(grid, start, end) {
    const row = grid.length;
    const col = grid[0].length;

    const startNode = {
        x: start[0],
        y: start[1],
        gScore: 0,
        fScore: manhattanDistance(start, end),
    };

    const endNode = {
        x: end[0],
        y: end[1],
    };

    const openSet = new PriorityQueue();
    openSet.add(startNode);
    const cameFrom = new Map();

    while (!openSet.isEmpty()) {
        const currentNode = openSet.getNext();

        if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
            return reconstructPath(cameFrom, endNode);
        }

        openSet.remove(currentNode);
        const neighbors = getNeighbors(grid, currentNode, row, col);

        for (const neighbor of neighbors) {
            const tentativeGScore = currentNode.gScore + 1;
            if (cameFrom.has(neighbor) && tentativeGScore >= neighbor.gScore) {
                continue;
            }

            cameFrom.set(neighbor, currentNode);
            neighbor.gScore = tentativeGScore;
            neighbor.fScore = neighbor.gScore + manhattanDistance([neighbor.x, neighbor.y], end);
            openSet.add(neighbor);
        }
    }

    return [];
}

function manhattanDistance(start, end) {
    return Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]);
}

function getNeighbors(grid, node, row, col) {
    const neighbors = [];
    if (node.x > 0 && grid[node.x - 1][node.y] !== 1) {
        neighbors.push({ x: node.x - 1, y: node.y });
    }
    if (node.x < row - 1 && grid[node.x + 1][node.y] !== 1) {
        neighbors.push({ x: node.x + 1, y: node.y });
    }
    if (node.y > 0 && grid[node.x][node.y - 1] !== 1) {
        neighbors.push({ x: node.x, y: node.y - 1 });
    }
    if (node.y < col - 1 && grid[node.x][node.y + 1] !== 1) {
        neighbors.push({ x: node.x, y: node.y + 1 });
    }
    return neighbors;
}

function reconstructPath(cameFrom, endNode) {
    let currentNode = endNode;
    const path = [[endNode.x, endNode.y]];
    while (cameFrom.has(currentNode)) {
        currentNode = cameFrom.get(currentNode);
        path.unshift([currentNode.x, currentNode.y]);
    }
    return path;
}