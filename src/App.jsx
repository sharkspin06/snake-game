import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

const POKEMON_OPTIONS = [
  { id: 'pikachu', name: 'Pikachu', emoji: '⚡', color: '#FFD700' },
  { id: 'charmander', name: 'Charmander', emoji: '🔥', color: '#FF6B35' },
  { id: 'eevee', name: 'Eevee', emoji: '🦊', color: '#D4A574' },
  { id: 'jigglypuff', name: 'Jigglypuff', emoji: '🎵', color: '#FF69B4' },
];

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showPokemonMenu, setShowPokemonMenu] = useState(false);
  const [customSvg, setCustomSvg] = useState(null);
  const [customSvgName, setCustomSvgName] = useState('');
  const [loadedHeads, setLoadedHeads] = useState([]);
  const [allOptions, setAllOptions] = useState(POKEMON_OPTIONS);
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef(INITIAL_DIRECTION);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/heads/heads-config.json')
      .then(res => res.json())
      .then(data => {
        const headOptions = data.heads.map((filename, index) => {
          const name = filename.replace(/\.(png|jpg|jpeg|svg|gif|webp)$/i, '');
          const colors = ['#FFD700', '#FF6B35', '#4A90E2', '#4CAF50', '#D4A574', '#FF69B4', '#9333ea', '#ec4899', '#f59e0b', '#10b981'];
          return {
            id: `head-${index}`,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            emoji: null,
            color: colors[index % colors.length],
            svgData: `/heads/${filename}`
          };
        });
        setLoadedHeads(headOptions);
        // Filter out emoji Pokemon that have PNG duplicates
        const pngNames = headOptions.map(h => h.name.toLowerCase());
        const uniqueEmojiPokemon = POKEMON_OPTIONS.filter(p => 
          !pngNames.includes(p.name.toLowerCase())
        );
        const combined = [...uniqueEmojiPokemon, ...headOptions];
        setAllOptions(combined);
        if (!selectedPokemon) {
          setSelectedPokemon(combined[0]);
        }
      })
      .catch(err => {
        console.log('No custom heads found, using default options');
        setAllOptions(POKEMON_OPTIONS);
        if (!selectedPokemon) {
          setSelectedPokemon(POKEMON_OPTIONS[0]);
        }
      });
  }, []);

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileName = file.name.replace(/\.(svg|png|jpg|jpeg|gif|webp)$/i, '');
        setCustomSvg(e.target.result);
        setCustomSvgName(fileName);
        setSelectedPokemon({
          id: 'custom',
          name: fileName,
          emoji: null,
          color: '#9333ea',
          svgData: e.target.result
        });
        setShowPokemonMenu(false);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid image file (PNG, JPG, SVG, etc.)');
    }
  };

  const handleDirectionChange = (newDirection) => {
    if (
      newDirection.x !== -directionRef.current.x ||
      newDirection.y !== -directionRef.current.y
    ) {
      setDirection(newDirection);
      directionRef.current = newDirection;
    }
  };

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y,
      };

      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setShowJumpscare(true);
        setTimeout(() => {
          setShowJumpscare(false);
          setGameOver(true);
        }, 2000);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, gameStarted, food, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted && e.key === ' ') {
        resetGame();
        return;
      }

      if (e.key === ' ') {
        setIsPaused(prev => !prev);
        return;
      }

      const keyMap = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        e.preventDefault();
        if (
          newDirection.x !== -directionRef.current.x ||
          newDirection.y !== -directionRef.current.y
        ) {
          setDirection(newDirection);
          directionRef.current = newDirection;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, resetGame]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  useEffect(() => {
    const speedLevel = Math.floor(snake.length / 5);
    const newSpeed = Math.max(50, INITIAL_SPEED - (speedLevel * 15));
    setSpeed(newSpeed);
  }, [snake.length]);

  return (
    <div className="app">
      <div className="game-container">
        <h1 className="title">Snake Game</h1>
        
        <div className="score-board">
          <div className="score">Score: {score}</div>
          <div className="high-score">Length: {snake.length}</div>
          <button 
            className="pokemon-selector-btn"
            onClick={() => setShowPokemonMenu(!showPokemonMenu)}
            disabled={false}
          >
            Change Your Character
          </button>
        </div>

        {showPokemonMenu && (
          <div className="pokemon-menu">
            <h3>Choose Your Pokemon</h3>
            <div className="pokemon-grid">
              {allOptions.map(pokemon => (
                <button
                  key={pokemon.id}
                  className={`pokemon-option ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPokemon(pokemon);
                    setShowPokemonMenu(false);
                  }}
                  style={{ borderColor: pokemon.color }}
                >
                  {pokemon.svgData ? (
                    <img src={pokemon.svgData} alt={pokemon.name} className="pokemon-emoji-img" />
                  ) : (
                    <span className="pokemon-emoji">{pokemon.emoji}</span>
                  )}
                  <span className="pokemon-name">{pokemon.name}</span>
                </button>
              ))}
              <button
                className={`pokemon-option upload-option ${selectedPokemon.id === 'custom' ? 'selected' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                style={{ borderColor: '#9333ea' }}
              >
                <span className="pokemon-emoji">📤</span>
                <span className="pokemon-name">Upload Image</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="cancel-button"
              onClick={() => setShowPokemonMenu(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <div 
          className="game-board"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`snake-segment ${index === 0 ? 'snake-head' : ''}`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                background: index === 0 ? 'transparent' : undefined,
              }}
            >
              {index === 0 && selectedPokemon && (
                selectedPokemon.svgData ? (
                  <img 
                    src={selectedPokemon.svgData} 
                    alt="custom" 
                    className="pokemon-head-svg"
                    style={{ 
                      width: `${CELL_SIZE - 2}px`, 
                      height: `${CELL_SIZE - 2}px` 
                    }}
                  />
                ) : (
                  <span className="pokemon-head" style={{ fontSize: `${CELL_SIZE - 4}px` }}>
                    {selectedPokemon.emoji}
                  </span>
                )
              )}
            </div>
          ))}
          <div
            className="food"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        </div>

        {!gameStarted && selectedPokemon && (
          <div className="overlay">
            <div className="message">
              <h2>Welcome to Pokemon Sake!</h2>
              {!showPokemonMenu ? (
                <>
                  <p>Choose your snake head:</p>
                  <button 
                    onClick={() => setShowPokemonMenu(true)} 
                    className="restart-button"
                    style={{marginBottom: '10px'}}
                  >
                    {selectedPokemon.svgData ? (
                      <><img src={selectedPokemon.svgData} alt={selectedPokemon.name} style={{width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px'}} /> {selectedPokemon.name}</>
                    ) : (
                      <>{selectedPokemon.emoji} {selectedPokemon.name}</>
                    )}
                  </button>
                  <br />
                  <button onClick={resetGame} className="restart-button" style={{marginTop: '15px'}}>
                    Start Game
                  </button>
                  <p className="controls">Arrow keys to move • SPACE to pause</p>
                </>
              ) : null}
            </div>
          </div>
        )}

        {showJumpscare && (
          <div className="jumpscare-overlay">
            <img 
              src="/gameover.gif" 
              alt="Jumpscare" 
              className="jumpscare-gif"
            />
          </div>
        )}

        {gameOver && !showJumpscare && (
          <div className="overlay">
            <div className="message">
              <h2>Game Over!</h2>
              <p>Final Score: {score}</p>
              <button onClick={resetGame} className="restart-button">
                Play Again
              </button>
              <button 
                onClick={() => {
                  setGameOver(false);
                  setGameStarted(false);
                  setSnake(INITIAL_SNAKE);
                  setScore(0);
                }} 
                className="cancel-button"
                style={{marginTop: '15px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isPaused && gameStarted && !gameOver && (
          <div className="overlay">
            <div className="message">
              <h2>Paused</h2>
              <p>Press SPACE to continue</p>
            </div>
          </div>
        )}

        <div className="mobile-controls">
          <div className="control-row">
            <button 
              className="control-btn"
              onClick={() => handleDirectionChange({ x: 0, y: -1 })}
              disabled={!gameStarted || gameOver}
            >
              ▲
            </button>
          </div>
          <div className="control-row">
            <button 
              className="control-btn"
              onClick={() => handleDirectionChange({ x: -1, y: 0 })}
              disabled={!gameStarted || gameOver}
            >
              ◄
            </button>
            <button 
              className="control-btn"
              onClick={() => handleDirectionChange({ x: 0, y: 1 })}
              disabled={!gameStarted || gameOver}
            >
              ▼
            </button>
            <button 
              className="control-btn"
              onClick={() => handleDirectionChange({ x: 1, y: 0 })}
              disabled={!gameStarted || gameOver}
            >
              ►
            </button>
          </div>
        </div>

        <div className="instructions">
          <p>🎮 Arrow keys to move • SPACE to pause</p>
        </div>

        <div className="watermark">
          <img src="/logo.gif" alt="Logo" className="watermark-logo" />
        </div>
      </div>
    </div>
  );
}

export default App;
