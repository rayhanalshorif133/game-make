// Hammer Climber - Infinite Wall Breaker Game
// Canvas Logical Resolution: 1080 x 1920

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

// Grid & Tile Dimensions
const TILE_SIZE = 72; // 15 columns: 15 * 72 = 1080
const COLS = 15;

// Tile Types
const TILE_EMPTY = 0;
const TILE_SOLID = 1;     // Indestructible border/floor
const TILE_WALL = 2;      // Breakable wall
const TILE_PLATFORM = 3;  // One-way platform / floor
const TILE_CRACKED = 4;   // Damaged breakable wall

// Asset Manager
class AssetManager {
  constructor() {
    this.images = {};
    this.toLoad = 0;
    this.loaded = 0;
  }

  loadImage(key, src) {
    this.toLoad++;
    const img = new Image();
    img.onload = () => {
      this.loaded++;
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      this.loaded++;
    };
    img.src = src;
    this.images[key] = img;
  }

  isDone() {
    return this.toLoad === 0 || this.loaded >= this.toLoad;
  }

  getImage(key) {
    return this.images[key];
  }
}

const assets = new AssetManager();

// Load sprite assets
assets.loadImage('player_idle', 'Sprites/01-King Human/Idle (78x58).png');
assets.loadImage('player_run', 'Sprites/01-King Human/Run (78x58).png');
assets.loadImage('player_jump', 'Sprites/01-King Human/Jump (78x58).png');
assets.loadImage('player_fall', 'Sprites/01-King Human/Fall (78x58).png');
assets.loadImage('player_attack', 'Sprites/01-King Human/Attack (78x58).png');
assets.loadImage('player_hit', 'Sprites/01-King Human/Hit (78x58).png');
assets.loadImage('player_dead', 'Sprites/01-King Human/Dead (78x58).png');

assets.loadImage('pig_idle', 'Sprites/03-Pig/Idle (34x28).png');
assets.loadImage('pig_run', 'Sprites/03-Pig/Run (34x28).png');
assets.loadImage('pig_attack', 'Sprites/03-Pig/Attack (34x28).png');
assets.loadImage('pig_hit', 'Sprites/03-Pig/Hit (34x28).png');
assets.loadImage('pig_dead', 'Sprites/03-Pig/Dead (34x28).png');

assets.loadImage('pig_bomb_idle', 'Sprites/05-Pig Thowing a Bomb/Idle (26x26).png');
assets.loadImage('pig_bomb_throw', 'Sprites/05-Pig Thowing a Bomb/Throwing Boom (26x26).png');
assets.loadImage('bomb_on', 'Sprites/09-Bomb/Bomb On (52x56).png');
assets.loadImage('bomb_boom', 'Sprites/09-Bomb/Boooooom (52x56).png');

assets.loadImage('terrain', 'Free/Terrain/Terrain (16x16).png');
assets.loadImage('bg_brown', 'Free/Background/Brown.png');
assets.loadImage('heart_idle', 'Sprites/12-Live and Coins/Big Heart Idle (18x14).png');
assets.loadImage('diamond_idle', 'Sprites/12-Live and Coins/Big Diamond Idle (18x14).png');
assets.loadImage('box_idle', 'Sprites/08-Box/Idle.png');

// Kings & Pigs UI Assets
assets.loadImage('live_bar', 'Sprites/12-Live and Coins/Live Bar.png');
assets.loadImage('small_heart', 'Sprites/12-Live and Coins/Small Heart Idle (18x14).png');
assets.loadImage('small_diamond', 'Sprites/12-Live and Coins/Small Diamond (18x14).png');
assets.loadImage('numbers', 'Sprites/12-Live and Coins/Numbers (6x8).png');

// Sprite Animation Helper
class SpriteAnimation {
  constructor(imgKey, frameWidth, frameHeight, frameCount, frameDuration = 100, loop = true) {
    this.imgKey = imgKey;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.frameDuration = frameDuration;
    this.loop = loop;
    this.elapsed = 0;
    this.currentFrame = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;
    this.elapsed += dt;
    if (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.frameCount) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frameCount - 1;
          this.finished = true;
        }
      }
    }
  }

  draw(ctx, x, y, width, height, flipX = false) {
    const img = assets.getImage(this.imgKey);
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x, y, width, height);
      return;
    }

    ctx.save();
    if (flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        img,
        this.currentFrame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
        0, 0, width, height
      );
    } else {
      ctx.drawImage(
        img,
        this.currentFrame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
        x, y, width, height
      );
    }
    ctx.restore();
  }

  reset() {
    this.currentFrame = 0;
    this.elapsed = 0;
    this.finished = false;
  }
}

// Item Collectible Class (Diamond / Heart)
class Collectible {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 40;
    this.height = 40;
    this.collected = false;

    if (type === 'diamond') {
      this.anim = new SpriteAnimation('diamond_idle', 18, 14, 10, 100);
    } else {
      this.anim = new SpriteAnimation('heart_idle', 18, 14, 8, 120);
    }
  }

  update(dt, player) {
    if (this.collected) return;
    this.anim.update(dt * 1000);

    if (Math.abs(this.x - player.x) < 45 && Math.abs(this.y - player.y) < 45) {
      this.collected = true;
      if (this.type === 'diamond') {
        game.score += 100;
      } else if (this.type === 'heart') {
        player.health = Math.min(player.maxHealth, player.health + 1);
      }
    }
  }

  draw(ctx, cameraY) {
    if (this.collected) return;
    const screenX = this.x;
    const screenY = cameraY - this.y - this.height;
    this.anim.draw(ctx, screenX, screenY, this.width, this.height);
  }
}

// Tower / Infinite Wall World Map
class World {
  constructor() {
    this.rows = {};
    this.highestRowGenerated = 0;
    this.lowestRowGenerated = -5;
    this.brokenWalls = [];
    this.generateInitialArea();
  }

  generateInitialArea() {
    for (let r = -5; r <= 30; r++) {
      this.generateRow(r);
    }
    this.highestRowGenerated = 30;
  }

  generateRow(r) {
    if (this.rows[r]) return;
    const tiles = new Array(COLS).fill(TILE_EMPTY);

    tiles[0] = TILE_SOLID;
    tiles[COLS - 1] = TILE_SOLID;

    if (r <= 0) {
      if (r === 0) {
        for (let c = 0; c < COLS; c++) tiles[c] = TILE_SOLID;
      }
    } else {
      if (r % 3 === 0) {
        for (let c = 1; c < COLS - 1; c++) {
          tiles[c] = TILE_WALL;
        }
      } else if (r % 3 === 1) {
        for (let c = 1; c < COLS - 1; c++) {
          if (c % 2 === 0 || Math.random() < 0.6) {
            tiles[c] = TILE_WALL;
          } else {
            tiles[c] = TILE_PLATFORM;
          }
        }
      } else {
        for (let c = 1; c < COLS - 1; c++) {
          if (Math.random() < 0.4) {
            tiles[c] = TILE_WALL;
          } else if (Math.random() < 0.3) {
            tiles[c] = TILE_PLATFORM;
          }
        }
      }
    }

    this.rows[r] = tiles;
  }

  ensureRowsUpTo(targetRow) {
    while (this.highestRowGenerated < targetRow + 25) {
      this.highestRowGenerated++;
      this.generateRow(this.highestRowGenerated);

      if (this.highestRowGenerated % 3 === 0) {
        const enemyCol = Math.floor(Math.random() * (COLS - 4)) + 2;
        game.spawnEnemy(enemyCol * TILE_SIZE, this.highestRowGenerated * TILE_SIZE);
      }

      if (Math.random() < 0.4) {
        const itemCol = Math.floor(Math.random() * (COLS - 2)) + 1;
        const itemType = Math.random() < 0.25 ? 'heart' : 'diamond';
        game.collectibles.push(new Collectible(itemCol * TILE_SIZE + 15, this.highestRowGenerated * TILE_SIZE + 10, itemType));
      }
    }
  }

  getTile(col, row) {
    if (col < 0 || col >= COLS) return TILE_SOLID;
    if (!this.rows[row]) {
      this.generateRow(row);
    }
    return this.rows[row][col];
  }

  setTile(col, row, type) {
    if (col <= 0 || col >= COLS - 1) return;
    if (!this.rows[row]) this.generateRow(row);
    this.rows[row][col] = type;
  }

  damageWall(col, row) {
    const tile = this.getTile(col, row);
    if (tile === TILE_WALL) {
      this.setTile(col, row, TILE_CRACKED);
      return false;
    } else if (tile === TILE_CRACKED) {
      this.setTile(col, row, TILE_EMPTY);
      this.brokenWalls.push({ col, row, repairProgress: 0, maxRepair: 100 });
      return true;
    }
    return false;
  }

  repairWallStep(col, row, amount) {
    const target = this.brokenWalls.find(w => w.col === col && w.row === row);
    if (target) {
      target.repairProgress += amount;
      if (target.repairProgress >= target.maxRepair) {
        this.setTile(col, row, TILE_WALL);
        this.brokenWalls = this.brokenWalls.filter(w => !(w.col === col && w.row === row));
        return true;
      }
    } else {
      if (this.getTile(col, row) === TILE_EMPTY) {
        this.setTile(col, row, TILE_WALL);
        return true;
      }
    }
    return false;
  }

  draw(ctx, cameraY) {
    const bgImg = assets.getImage('bg_brown');
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      const pattern = ctx.createPattern(bgImg, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#221e2b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const startRow = Math.floor((cameraY - CANVAS_HEIGHT) / TILE_SIZE) - 2;
    const endRow = Math.ceil(cameraY / TILE_SIZE) + 2;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.getTile(c, r);
        if (tile === TILE_EMPTY) continue;

        const screenX = c * TILE_SIZE;
        const screenY = cameraY - (r * TILE_SIZE);

        if (tile === TILE_SOLID) {
          ctx.fillStyle = '#4a3b32';
          ctx.fillRect(screenX, screenY - TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#2d221c';
          ctx.lineWidth = 4;
          ctx.strokeRect(screenX, screenY - TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE_WALL) {
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(screenX + 2, screenY - TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#5c3a19';
          ctx.lineWidth = 3;
          ctx.strokeRect(screenX + 2, screenY - TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (tile === TILE_CRACKED) {
          ctx.fillStyle = '#a06b3a';
          ctx.fillRect(screenX + 2, screenY - TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(screenX + 10, screenY - TILE_SIZE + 10);
          ctx.lineTo(screenX + TILE_SIZE - 10, screenY - 10);
          ctx.moveTo(screenX + TILE_SIZE - 15, screenY - TILE_SIZE + 15);
          ctx.lineTo(screenX + 15, screenY - 15);
          ctx.stroke();
        } else if (tile === TILE_PLATFORM) {
          ctx.fillStyle = '#d35400';
          ctx.fillRect(screenX, screenY - TILE_SIZE, TILE_SIZE, 18);
        }
      }
    }

    for (let w of this.brokenWalls) {
      const screenX = w.col * TILE_SIZE;
      const screenY = cameraY - (w.row * TILE_SIZE);
      if (screenY > -TILE_SIZE && screenY < CANVAS_HEIGHT + TILE_SIZE) {
        if (w.repairProgress > 0) {
          ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
          ctx.fillRect(screenX + 4, screenY - TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(screenX + 4, screenY - TILE_SIZE - 10, (TILE_SIZE - 8) * (w.repairProgress / w.maxRepair), 6);
        }
      }
    }
  }
}

// Enemy Pig Class
class PigEnemy {
  constructor(x, y, world) {
    this.x = x;
    this.y = y;
    this.world = world;
    this.width = 50;
    this.height = 50;
    this.vx = (Math.random() > 0.5 ? 1 : -1) * 120;
    this.vy = 0;
    this.facingRight = this.vx > 0;
    this.isDead = false;
    this.isRepairing = false;
    this.repairTimer = 0;
    this.repairTarget = null;

    this.anims = {
      idle: new SpriteAnimation('pig_idle', 34, 28, 11, 100),
      run: new SpriteAnimation('pig_run', 34, 28, 12, 70),
      attack: new SpriteAnimation('pig_attack', 34, 28, 5, 100),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 100),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 150, false)
    };
    this.currentAnim = this.anims.run;
  }

  update(dt, player) {
    if (this.isDead) {
      this.currentAnim = this.anims.dead;
      this.currentAnim.update(dt * 1000);
      return;
    }

    if (!this.repairTarget) {
      if (this.world.brokenWalls.length > 0) {
        let minDist = 999999;
        let bestTarget = null;
        for (let bw of this.world.brokenWalls) {
          const dist = Math.abs((bw.col * TILE_SIZE) - this.x) + Math.abs((bw.row * TILE_SIZE) - this.y);
          if (dist < minDist && dist < 800) {
            minDist = dist;
            bestTarget = bw;
          }
        }
        this.repairTarget = bestTarget;
      }
    }

    if (this.repairTarget) {
      const targetX = this.repairTarget.col * TILE_SIZE;
      const dx = targetX - this.x;

      if (Math.abs(dx) > 10) {
        this.vx = dx > 0 ? 160 : -160;
        this.facingRight = this.vx > 0;
        this.isRepairing = false;
      } else {
        this.vx = 0;
        this.isRepairing = true;
        this.world.repairWallStep(this.repairTarget.col, this.repairTarget.row, 60 * dt);
        if (this.world.getTile(this.repairTarget.col, this.repairTarget.row) === TILE_WALL) {
          this.repairTarget = null;
          this.isRepairing = false;
        }
      }
    } else {
      if (Math.abs(this.vx) < 10) this.vx = 120;
    }

    this.x += this.vx * dt;
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);

    if (this.world.getTile(col, row) === TILE_SOLID || col <= 0 || col >= COLS - 1) {
      this.vx = -this.vx;
      this.facingRight = this.vx > 0;
    }

    if (Math.abs(this.x - player.x) < 45 && Math.abs(this.y - player.y) < 45) {
      player.takeDamage(1);
    }

    if (this.isRepairing) {
      this.currentAnim = this.anims.attack;
    } else if (Math.abs(this.vx) > 10) {
      this.currentAnim = this.anims.run;
    } else {
      this.currentAnim = this.anims.idle;
    }

    this.currentAnim.update(dt * 1000);
  }

  takeHit() {
    this.isDead = true;
    this.currentAnim = this.anims.dead;
  }

  draw(ctx, cameraY) {
    const screenX = this.x - 10;
    const screenY = cameraY - this.y - this.height;

    this.currentAnim.draw(ctx, screenX, screenY, 70, 60, !this.facingRight);
  }
}

// Player Character
class Player {
  constructor(world) {
    this.world = world;
    this.x = 7 * TILE_SIZE + 10;
    this.y = 1 * TILE_SIZE;
    this.width = 60;
    this.height = 70;
    this.vx = 0;
    this.vy = 0;
    this.speed = 420;
    this.jumpForce = 750;
    this.gravity = 1800;
    this.isGrounded = false;
    this.facingRight = true;
    this.health = 3;
    this.maxHealth = 3;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.invulnerableTimer = 0;

    this.anims = {
      idle: new SpriteAnimation('player_idle', 78, 58, 11, 100),
      run: new SpriteAnimation('player_run', 78, 58, 8, 80),
      jump: new SpriteAnimation('player_jump', 78, 58, 1, 100),
      fall: new SpriteAnimation('player_fall', 78, 58, 1, 100),
      attack: new SpriteAnimation('player_attack', 78, 58, 3, 70, false),
      hit: new SpriteAnimation('player_hit', 78, 58, 2, 120),
      dead: new SpriteAnimation('player_dead', 78, 58, 4, 150, false)
    };
    this.currentAnim = this.anims.idle;
  }

  update(dt, input, enemies) {
    if (this.health <= 0) {
      this.currentAnim = this.anims.dead;
      this.currentAnim.update(dt * 1000);
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    this.vx = 0;
    if (input.left) {
      this.vx = -this.speed;
      this.facingRight = false;
    }
    if (input.right) {
      this.vx = this.speed;
      this.facingRight = true;
    }

    if (input.jump && this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }

    if (input.hammer && !this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = 0.25;
      this.anims.attack.reset();
      this.performHammerHit(enemies);
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    this.vy -= this.gravity * dt;

    this.moveX(this.vx * dt);
    this.moveY(this.vy * dt);

    const currentRow = Math.floor(this.y / TILE_SIZE);
    this.world.ensureRowsUpTo(currentRow);

    if (this.isAttacking) {
      this.currentAnim = this.anims.attack;
    } else if (!this.isGrounded) {
      this.currentAnim = this.vy > 0 ? this.anims.jump : this.anims.fall;
    } else if (Math.abs(this.vx) > 10) {
      this.currentAnim = this.anims.run;
    } else {
      this.currentAnim = this.anims.idle;
    }

    this.currentAnim.update(dt * 1000);
  }

  moveX(dx) {
    this.x += dx;
    const leftCol = Math.floor(this.x / TILE_SIZE);
    const rightCol = Math.floor((this.x + this.width) / TILE_SIZE);
    const bottomRow = Math.floor(this.y / TILE_SIZE);
    const topRow = Math.floor((this.y + this.height - 1) / TILE_SIZE);

    for (let r = bottomRow; r <= topRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        const tile = this.world.getTile(c, r);
        if (tile === TILE_SOLID || tile === TILE_WALL || tile === TILE_CRACKED) {
          if (dx > 0) {
            this.x = c * TILE_SIZE - this.width - 0.1;
          } else if (dx < 0) {
            this.x = (c + 1) * TILE_SIZE + 0.1;
          }
          return;
        }
      }
    }
  }

  moveY(dy) {
    this.y += dy;
    this.isGrounded = false;

    const leftCol = Math.floor(this.x / TILE_SIZE);
    const rightCol = Math.floor((this.x + this.width - 1) / TILE_SIZE);
    const bottomRow = Math.floor(this.y / TILE_SIZE);
    const topRow = Math.floor((this.y + this.height) / TILE_SIZE);

    for (let r = bottomRow; r <= topRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        const tile = this.world.getTile(c, r);

        if (tile === TILE_SOLID || tile === TILE_WALL || tile === TILE_CRACKED) {
          if (dy < 0) {
            this.y = (r + 1) * TILE_SIZE;
            this.vy = 0;
            this.isGrounded = true;
          } else if (dy > 0) {
            this.y = r * TILE_SIZE - this.height - 0.1;
            this.vy = 0;
          }
          return;
        } else if (tile === TILE_PLATFORM && dy < 0) {
          const prevY = this.y - dy;
          if (prevY >= (r + 1) * TILE_SIZE) {
            this.y = (r + 1) * TILE_SIZE;
            this.vy = 0;
            this.isGrounded = true;
            return;
          }
        }
      }
    }
  }

  performHammerHit(enemies) {
    const attackDir = this.facingRight ? 1 : -1;
    const targetCol = Math.floor((this.x + (this.width / 2) + (attackDir * (TILE_SIZE * 0.9))) / TILE_SIZE);
    const playerRow = Math.floor((this.y + (this.height / 2)) / TILE_SIZE);

    for (let r = playerRow - 1; r <= playerRow + 1; r++) {
      const tile = this.world.getTile(targetCol, r);
      if (tile === TILE_WALL || tile === TILE_CRACKED) {
        this.world.damageWall(targetCol, r);
        game.score += 20;
        break;
      }
    }

    if (enemies) {
      for (let e of enemies) {
        if (!e.isDead && Math.abs(e.x - (this.x + attackDir * 50)) < 60 && Math.abs(e.y - this.y) < 60) {
          e.takeHit();
          game.score += 150;
        }
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.health <= 0) return;
    this.health -= amount;
    this.invulnerableTimer = 1.0;
    if (this.health <= 0) {
      this.health = 0;
    }
  }

  draw(ctx, cameraY) {
    const screenX = this.x - 15;
    const screenY = cameraY - this.y - this.height - 10;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    this.currentAnim.draw(ctx, screenX, screenY, 90, 80, !this.facingRight);
    ctx.globalAlpha = 1.0;
  }
}

// Game Controller & Main Loop
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.world = new World();
    this.player = new Player(this.world);
    this.enemies = [];
    this.collectibles = [];

    this.cameraY = CANVAS_HEIGHT;
    this.maxClimbedY = 0;
    this.score = 0;
    this.state = 'START';

    this.lastTime = 0;
    this.input = { left: false, right: false, jump: false, hammer: false };

    this.setupInputs();
    this.setupUI();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') this.input.jump = true;
      if (e.code === 'KeyJ' || e.code === 'KeyZ') this.input.hammer = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') this.input.jump = false;
      if (e.code === 'KeyJ' || e.code === 'KeyZ') this.input.hammer = false;
    });

    const addTouchListener = (elementId, inputKey) => {
      const btn = document.getElementById(elementId);
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        this.input[inputKey] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.input[inputKey] = false;
      };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
    };

    addTouchListener('btn-left', 'left');
    addTouchListener('btn-right', 'right');
    addTouchListener('btn-jump', 'jump');
    addTouchListener('btn-hammer', 'hammer');
  }

  setupUI() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const overlay = document.getElementById('ui-overlay');
        if (overlay) overlay.style.display = 'none';
        this.start();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        const overlay = document.getElementById('ui-overlay');
        if (overlay) overlay.style.display = 'none';
        this.start();
      });
    }
  }

  spawnEnemy(x, y) {
    this.enemies.push(new PigEnemy(x, y, this.world));
  }

  start() {
    this.state = 'PLAYING';
    this.world = new World();
    this.player = new Player(this.world);
    this.enemies = [];
    this.collectibles = [];
    this.cameraY = CANVAS_HEIGHT;
    this.maxClimbedY = 0;
    this.score = 0;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.player.update(dt, this.input, this.enemies);

    const targetCameraY = this.player.y + (CANVAS_HEIGHT * 0.65);
    if (targetCameraY > this.cameraY) {
      this.cameraY += (targetCameraY - this.cameraY) * 5 * dt;
    }

    const screenBottomY = this.cameraY - CANVAS_HEIGHT;
    if (this.player.y < screenBottomY - 100) {
      this.player.health = 0;
    }

    if (this.player.y > this.maxClimbedY) {
      const heightGained = Math.floor((this.player.y - this.maxClimbedY) / 10);
      this.score += heightGained;
      this.maxClimbedY = this.player.y;
    }

    for (let e of this.enemies) {
      e.update(dt, this.player);
    }
    this.enemies = this.enemies.filter(e => e.y > screenBottomY - 200);

    for (let c of this.collectibles) {
      c.update(dt, this.player);
    }
    this.collectibles = this.collectibles.filter(c => !c.collected && c.y > screenBottomY - 200);

    if (this.player.health <= 0) {
      this.state = 'GAMEOVER';
      document.getElementById('final-score').innerText = `Score: ${this.score}`;
      document.getElementById('final-height').innerText = `Max Height: ${Math.floor(this.maxClimbedY / 50)}m`;
      const overlay = document.getElementById('ui-overlay');
      if (overlay) overlay.style.display = 'flex';
      const gameOverScreen = document.getElementById('game-over-screen');
      if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    }
  }

  drawHUD() {
    // Kings & Pigs Stylized Live Bar
    const liveBar = assets.getImage('live_bar');
    if (liveBar && liveBar.complete && liveBar.naturalWidth > 0) {
      this.ctx.drawImage(liveBar, 30, 30, 260, 80);

      const smallHeart = assets.getImage('small_heart');
      if (smallHeart && smallHeart.complete && smallHeart.naturalWidth > 0) {
        for (let i = 0; i < this.player.health; i++) {
          this.ctx.drawImage(smallHeart, 0, 0, 18, 14, 110 + (i * 35), 58, 30, 24);
        }
      }
    } else {
      // Fallback
      this.ctx.fillStyle = '#e74c3c';
      for (let i = 0; i < this.player.health; i++) {
        this.ctx.beginPath();
        this.ctx.arc(60 + (i * 50), 60, 20, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Kings & Pigs Stylized Diamond / Score Panel
    const smallDiamond = assets.getImage('small_diamond');
    if (smallDiamond && smallDiamond.complete && smallDiamond.naturalWidth > 0) {
      this.ctx.drawImage(smallDiamond, 0, 0, 18, 14, CANVAS_WIDTH - 280, 45, 45, 35);
    }

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 36px "Courier New", monospace';
    this.ctx.textAlign = 'right';
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#000000';
    this.ctx.strokeText(`SCORE: ${this.score}`, CANVAS_WIDTH - 40, 65);
    this.ctx.fillText(`SCORE: ${this.score}`, CANVAS_WIDTH - 40, 65);

    this.ctx.strokeText(`HEIGHT: ${Math.floor(this.maxClimbedY / 50)}m`, CANVAS_WIDTH - 40, 115);
    this.ctx.fillText(`HEIGHT: ${Math.floor(this.maxClimbedY / 50)}m`, CANVAS_WIDTH - 40, 115);
  }

  render() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.world.draw(this.ctx, this.cameraY);

    for (let c of this.collectibles) {
      c.draw(this.ctx, this.cameraY);
    }

    for (let e of this.enemies) {
      e.draw(this.ctx, this.cameraY);
    }

    this.player.draw(this.ctx, this.cameraY);

    if (this.state === 'PLAYING') {
      this.drawHUD();
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

const game = new Game();
requestAnimationFrame((t) => game.loop(t));

console.log("Kings & Pigs UI Assets loaded into game.js");
