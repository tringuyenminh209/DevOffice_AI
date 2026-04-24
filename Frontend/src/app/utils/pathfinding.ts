// A* Pathfinding Algorithm for Agent Movement

export interface Point {
  x: number;
  y: number;
}

export interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: Node | null;
}

const GRID_SIZE = 60; // 60px grid
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

// Define obstacle zones (furniture, walls, etc.)
const OBSTACLES: Point[] = [
  // Add obstacles based on furniture positions
  // Format: grid coordinates, not pixel coordinates
];

function heuristic(a: Point, b: Point): number {
  // Manhattan distance
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWalkable(x: number, y: number): boolean {
  // Check if position is within bounds
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
    return false;
  }

  // Check if position is an obstacle
  return !OBSTACLES.some(obs => obs.x === x && obs.y === y);
}

function getNeighbors(node: Node): Point[] {
  const neighbors: Point[] = [];
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }, // Left
  ];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newY = node.y + dir.y;

    if (isWalkable(newX, newY)) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

export function findPath(start: Point, end: Point): Point[] {
  // Convert pixel coordinates to grid coordinates
  const startGrid = {
    x: Math.floor(start.x / GRID_SIZE),
    y: Math.floor(start.y / GRID_SIZE)
  };

  const endGrid = {
    x: Math.floor(end.x / GRID_SIZE),
    y: Math.floor(end.y / GRID_SIZE)
  };

  const openSet: Node[] = [];
  const closedSet: Set<string> = new Set();

  const startNode: Node = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    h: heuristic(startGrid, endGrid),
    f: 0,
    parent: null
  };

  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // Check if we reached the goal
    if (current.x === endGrid.x && current.y === endGrid.y) {
      // Reconstruct path
      const path: Point[] = [];
      let node: Node | null = current;

      while (node !== null) {
        // Convert back to pixel coordinates (center of grid cell)
        path.unshift({
          x: node.x * GRID_SIZE + GRID_SIZE / 2,
          y: node.y * GRID_SIZE + GRID_SIZE / 2
        });
        node = node.parent;
      }

      return path;
    }

    const key = `${current.x},${current.y}`;
    closedSet.add(key);

    // Check neighbors
    const neighbors = getNeighbors(current);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey)) {
        continue;
      }

      const g = current.g + 1;
      const h = heuristic(neighbor, endGrid);
      const f = g + h;

      const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          x: neighbor.x,
          y: neighbor.y,
          g,
          h,
          f,
          parent: current
        });
      }
    }
  }

  // No path found, return direct line
  return [start, end];
}

// Zone target positions
export const ZONE_POSITIONS = {
  lounge: { x: 178, y: 180 },
  dataVault: { x: 1154, y: 180 },
  workstations: {
    RS: { x: 400, y: 320 },
    AN: { x: 600, y: 320 },
    WR: { x: 800, y: 320 },
    RV: { x: 400, y: 480 },
    DV: { x: 600, y: 480 }
  },
  meetingRoom: { x: 1134, y: 537 },
  approvalGate: { x: 640, y: 280 }
};
