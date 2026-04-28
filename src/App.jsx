import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { database } from './firebase';
import { ref, push, onValue, query, orderByChild, limitToLast } from 'firebase/database';

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

const BOARD_THEMES = [
  { id: 'grass', name: 'Grass Field', bgColor: '#1e3a20', bgImage: '/themes/grass.png', gridColor: 'rgba(255, 255, 255, 0.4)', snakeColor: '#7cb342', foodColor: '#ff6f00' },
  { id: 'greenarena', name: 'Green Arena', bgColor: '#2d5016', bgImage: '/themes/greenarena.png', gridColor: 'rgba(255, 255, 255, 0.3)', snakeColor: '#8bc34a', foodColor: '#ffeb3b' },
  { id: 'dragon', name: 'Dragon Cave', bgColor: '#3d1e1e', bgImage: '/themes/dragon.png', gridColor: 'rgba(255, 100, 0, 0.4)', snakeColor: '#ff6b6b', foodColor: '#ffd93d' },
  { id: 'purple', name: 'Purple Dream', bgColor: '#2d1b3d', bgImage: '/themes/purple.png', gridColor: 'rgba(200, 100, 255, 0.4)', snakeColor: '#9b59b6', foodColor: '#f39c12' },
  { id: 'fairy', name: 'Fairy Garden', bgColor: '#4a1a3d', bgImage: '/themes/fairy.png', gridColor: 'rgba(255, 192, 203, 0.4)', snakeColor: '#ff69b4', foodColor: '#ffd700' },
  { id: 'brown', name: 'Earth Ground', bgColor: '#3d2a1e', bgImage: '/themes/brown.png', gridColor: 'rgba(139, 90, 43, 0.5)', snakeColor: '#8b6f47', foodColor: '#ff8c00' },
  { id: 'cloud', name: 'Cloud Sky', bgColor: '#87ceeb', bgImage: '/themes/cloud.png', gridColor: 'rgba(255, 255, 255, 0.5)', snakeColor: '#4fc3f7', foodColor: '#ffeb3b' },
  { id: 'ice', name: 'Ice World', bgColor: '#e0f7fa', bgImage: '/themes/ice.png', gridColor: 'rgba(0, 188, 212, 0.4)', snakeColor: '#00bcd4', foodColor: '#ff5722' },
  { id: 'punk', name: 'Punk Rock', bgColor: '#1a1a1a', bgImage: '/themes/punk.png', gridColor: 'rgba(255, 0, 255, 0.5)', snakeColor: '#e91e63', foodColor: '#00ff00' },
];

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [goldenFood, setGoldenFood] = useState(null);
  const [lastWasGolden, setLastWasGolden] = useState(false);
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
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(BOARD_THEMES[1]);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [showGameOverFlash, setShowGameOverFlash] = useState(false);
  const directionRef = useRef(INITIAL_DIRECTION);
  const audioRef = useRef(null);
  const gameOverSoundRef = useRef(null);
  const clickSoundRef = useRef(null);
  const biteSoundRef = useRef(null);
  const goldenBiteSoundRef = useRef(null);
  const hoverSoundRef = useRef(null);

  useEffect(() => {
    // Load leaderboard from Firebase
    const leaderboardRef = ref(database, 'leaderboard');
    const leaderboardQuery = query(leaderboardRef, orderByChild('score'), limitToLast(10));
    
    const unsubscribe = onValue(leaderboardQuery, (snapshot) => {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        scores.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Reverse to show highest scores first
      setLeaderboard(scores.reverse());
    });

    return () => unsubscribe();
  }, []);

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

  const generateFood = useCallback((currentSnake, preventGolden = false) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    );
    
    // 10% chance to spawn golden pokeball (but not if last one was golden)
    if (!preventGolden && Math.random() < 0.1) {
      setGoldenFood(newFood);
      setLastWasGolden(true);
      return null; // No regular food when golden appears
    } else {
      setGoldenFood(null);
      setLastWasGolden(false);
      return newFood;
    }
  }, []);

  const handleDirectionChange = (newDirection) => {
    if (
      newDirection.x !== -directionRef.current.x ||
      newDirection.y !== -directionRef.current.y
    ) {
      setDirection(newDirection);
      directionRef.current = newDirection;
    }
  };

  const saveScoreToLeaderboard = (name, finalScore) => {
    const newEntry = {
      name: name || 'Anonymous',
      score: finalScore,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      character: selectedPokemon?.name || 'Unknown'
    };

    // Save to Firebase
    const leaderboardRef = ref(database, 'leaderboard');
    push(leaderboardRef, newEntry)
      .then(() => {
        console.log('Score saved to Firebase!');
      })
      .catch((error) => {
        console.error('Error saving score:', error);
        // Fallback to localStorage if Firebase fails
        const savedLeaderboard = localStorage.getItem('snakeGameLeaderboard');
        const localScores = savedLeaderboard ? JSON.parse(savedLeaderboard) : [];
        const updatedLocal = [...localScores, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        localStorage.setItem('snakeGameLeaderboard', JSON.stringify(updatedLocal));
      });
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

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        // Play game over sound
        if (gameOverSoundRef.current) {
          gameOverSoundRef.current.play().catch(err => console.log('Sound play failed:', err));
        }
        // Show flash
        setShowGameOverFlash(true);
        setTimeout(() => {
          setShowGameOverFlash(false);
          setGameOver(true);
        }, 2000);
        return prevSnake;
      }

      // Check if eating regular or golden food
      const ateRegularFood = food && newHead.x === food.x && newHead.y === food.y;
      const ateGoldenFood = goldenFood && newHead.x === goldenFood.x && newHead.y === goldenFood.y;
      const ateAnyFood = ateRegularFood || ateGoldenFood;
      
      // Check self-collision (exclude tail if not eating food, as it will move)
      const bodyToCheck = ateAnyFood ? prevSnake : prevSnake.slice(0, -1);
      if (bodyToCheck.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        // Play game over sound
        if (gameOverSoundRef.current) {
          gameOverSoundRef.current.play().catch(err => console.log('Sound play failed:', err));
        }
        // Show flash
        setShowGameOverFlash(true);
        setTimeout(() => {
          setShowGameOverFlash(false);
          setGameOver(true);
        }, 2000);
        return prevSnake;
      }

      let newSnake = [newHead, ...prevSnake];

      if (ateRegularFood) {
        // Play bite sound
        if (biteSoundRef.current) {
          biteSoundRef.current.currentTime = 0;
          biteSoundRef.current.play().catch(err => console.log('Bite sound failed:', err));
        }
        setScore(prev => prev + 10);
        const newFood = generateFood(newSnake, false);
        setFood(newFood);
      } else if (ateGoldenFood) {
        // Play golden bite sound
        if (goldenBiteSoundRef.current) {
          goldenBiteSoundRef.current.currentTime = 0;
          goldenBiteSoundRef.current.play().catch(err => console.log('Golden bite sound failed:', err));
        }
        setScore(prev => prev + 30);
        // Add 2 more segments (total 3 with the one already added)
        newSnake = [newHead, ...prevSnake, prevSnake[prevSnake.length - 1], prevSnake[prevSnake.length - 1]];
        // Prevent golden from appearing again immediately
        const newFood = generateFood(newSnake, true);
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameOver, isPaused, gameStarted, food, goldenFood, generateFood]);

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

  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying && !isPaused) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPaused, isMusicPlaying]);

  useEffect(() => {
    // Try to play music on first user interaction
    const playMusic = () => {
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', playMusic, { once: true });
    document.addEventListener('keydown', playMusic, { once: true });

    return () => {
      document.removeEventListener('click', playMusic);
      document.removeEventListener('keydown', playMusic);
    };
  }, [isMusicPlaying]);

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(err => console.log('Click sound failed:', err));
    }
  };

  const playHoverSound = () => {
    if (hoverSoundRef.current) {
      hoverSoundRef.current.volume = 0.3;
      hoverSoundRef.current.currentTime = 0;
      hoverSoundRef.current.play().catch(err => console.log('Hover sound failed:', err));
    }
  };

  return (
    <div className="app">
      <div className="game-container">
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px'}}>
          <div className="score" style={{fontFamily: "'Press Start 2P', cursive", color: '#FFCB05', textShadow: '3px 3px 0px #3D7DCA, -1px -1px 0px #3D7DCA, 1px -1px 0px #3D7DCA, -1px 1px 0px #3D7DCA, 1px 1px 0px #3D7DCA'}}>Score: {score}</div>
          <div className="high-score" style={{fontFamily: "'Press Start 2P', cursive", color: '#FFCB05', textShadow: '3px 3px 0px #3D7DCA, -1px -1px 0px #3D7DCA, 1px -1px 0px #3D7DCA, -1px 1px 0px #3D7DCA, 1px 1px 0px #3D7DCA'}}>Length: {snake.length}</div>
        </div>
        <div className="score-board">
        </div>

        <audio ref={audioRef} loop>
          <source src="/music/background.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={gameOverSoundRef}>
          <source src="/sounds/gameover.wav" type="audio/wav" />
        </audio>

        <audio ref={clickSoundRef}>
          <source src="/sounds/click.flac" type="audio/flac" />
        </audio>

        <audio ref={biteSoundRef}>
          <source src="/sounds/bite.wav" type="audio/wav" />
        </audio>

        <audio ref={goldenBiteSoundRef}>
          <source src="/sounds/goldenbite.wav" type="audio/wav" />
        </audio>

        <audio ref={hoverSoundRef} preload="auto">
          <source src="/sounds/hover.wav" type="audio/wav" />
        </audio>

        {showThemeMenu && (
          <div className="pokemon-menu">
            <h3 style={{
              fontFamily: "'Press Start 2P', cursive",
              color: '#FFCB05',
              textShadow: '3px 3px 0px #3D7DCA, -2px -2px 0px #3D7DCA, 2px -2px 0px #3D7DCA, -2px 2px 0px #3D7DCA, 2px 2px 0px #3D7DCA'
            }}>Choose Board Theme</h3>
            <div className="pokemon-grid">
              {BOARD_THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={`pokemon-option ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTheme(theme);
                    setShowThemeMenu(false);
                  }}
                  style={{ 
                    borderColor: theme.snakeColor,
                    background: selectedTheme?.id === theme.id ? theme.snakeColor : 'white'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: theme.bgColor,
                    backgroundImage: theme.bgImage 
                      ? `
                        linear-gradient(${theme.gridColor} 1px, transparent 1px),
                        linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px),
                        url('${theme.bgImage}')
                      `
                      : `
                        linear-gradient(${theme.gridColor} 1px, transparent 1px),
                        linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)
                      `,
                    backgroundSize: theme.bgImage ? '10px 10px, 10px 10px, cover' : '10px 10px, 10px 10px',
                    backgroundPosition: theme.bgImage ? '0 0, 0 0, center' : '0 0, 0 0',
                    borderRadius: '8px',
                    border: `3px solid ${theme.snakeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      background: theme.snakeColor,
                      borderRadius: '2px'
                    }}></div>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: theme.foodColor,
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '10px',
                      right: '10px'
                    }}></div>
                  </div>
                  <span className="pokemon-name">{theme.name}</span>
                </button>
              ))}
            </div>
            <img 
              src="/buttons/close.gif"
              alt="Close"
              onClick={() => { playClickSound(); setShowThemeMenu(false); }}
              onMouseEnter={playHoverSound}
              style={{cursor: 'pointer', width: '100%', maxWidth: '250px', marginTop: '15px', display: 'block', marginLeft: 'auto', marginRight: 'auto'}}
            />
          </div>
        )}

        {showPokemonMenu && (
          <div className="pokemon-menu">
            <h3 style={{
              fontFamily: "'Press Start 2P', cursive",
              color: '#FFCB05',
              textShadow: '3px 3px 0px #3D7DCA, -2px -2px 0px #3D7DCA, 2px -2px 0px #3D7DCA, -2px 2px 0px #3D7DCA, 2px 2px 0px #3D7DCA'
            }}>Choose Your Pokemon</h3>
            <div className="pokemon-grid">
              {allOptions.map(pokemon => (
                <button
                  key={pokemon.id}
                  className={`pokemon-option ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                  onClick={() => {
                    playClickSound();
                    setSelectedPokemon(pokemon);
                    setShowPokemonMenu(false);
                  }}
                  onMouseEnter={playHoverSound}
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
            </div>
            <img 
              src="/buttons/cancel.gif"
              alt="Cancel"
              onClick={() => { playClickSound(); setShowPokemonMenu(false); }}
              onMouseEnter={playHoverSound}
              style={{cursor: 'pointer', width: '100%', maxWidth: '250px', marginTop: '15px', display: 'block', marginLeft: 'auto', marginRight: 'auto'}}
            />
          </div>
        )}

        <div 
          className="game-board"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            backgroundColor: selectedTheme.bgColor,
            backgroundImage: selectedTheme.bgImage 
              ? `
                linear-gradient(${selectedTheme.gridColor} 1px, transparent 1px),
                linear-gradient(90deg, ${selectedTheme.gridColor} 1px, transparent 1px),
                url('${selectedTheme.bgImage}')
              `
              : `
                linear-gradient(${selectedTheme.gridColor} 1px, transparent 1px),
                linear-gradient(90deg, ${selectedTheme.gridColor} 1px, transparent 1px)
              `,
            backgroundSize: selectedTheme.bgImage ? '20px 20px, 20px 20px, cover' : '20px 20px, 20px 20px',
            backgroundPosition: selectedTheme.bgImage ? '0 0, 0 0, center' : '0 0, 0 0',
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
                background: index === 0 ? 'transparent' : selectedTheme.snakeColor,
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
          {food && (
            <div
              className="food"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundImage: 'url(/pokeball.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
          {goldenFood && (
            <div
              className="food"
              style={{
                left: goldenFood.x * CELL_SIZE,
                top: goldenFood.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundImage: 'url(/goldpokeball.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'drop-shadow(0 0 8px gold)',
              }}
            />
          )}
        </div>

        {!gameStarted && selectedPokemon && (
          <div className="overlay">
            <div className="message">
              <h2>Welcome to Pokemon Snake!</h2>
              {!showPokemonMenu ? (
                <>
                  <p>Choose your snake head:</p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '280px', alignItems: 'center', margin: '0 auto'}}>
                    <img 
                      src="/buttons/character-btn.gif" 
                      alt="Choose Character" 
                      onClick={() => { playClickSound(); setShowPokemonMenu(true); }}
                      onMouseEnter={playHoverSound}
                      style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                    />
                    <img 
                      src="/buttons/start-game.gif" 
                      alt="Start Game" 
                      onClick={() => { playClickSound(); resetGame(); }}
                      onMouseEnter={playHoverSound}
                      style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                    />
                    <img 
                      src="/buttons/leaderboard.gif" 
                      alt="View Leaderboard" 
                      onClick={() => { playClickSound(); setShowLeaderboard(true); }}
                      onMouseEnter={playHoverSound}
                      style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                    />
                    <img 
                      src="/buttons/theme.gif" 
                      alt="Change Theme" 
                      onClick={() => { playClickSound(); setShowThemeMenu(true); }}
                      onMouseEnter={playHoverSound}
                      style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                    />
                    <img 
                      src={isMusicPlaying ? "/buttons/music-on.gif" : "/buttons/music-off.gif"}
                      alt="Music Toggle" 
                      onClick={() => { playClickSound(); toggleMusic(); }}
                      onMouseEnter={playHoverSound}
                      style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {gameOver && (
          <div className="overlay">
            <div className="message">
              <h2>Game Over!</h2>
              <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>Final Score: {score}</p>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="name-input"
                maxLength={15}
              />
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '280px', alignItems: 'center', margin: '0 auto'}}>
                <img 
                  src="/buttons/save-score.gif" 
                  alt="Save Score" 
                  onClick={() => {
                    playClickSound();
                    saveScoreToLeaderboard(playerName, score);
                    setPlayerName('');
                    setShowLeaderboard(true);
                  }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/play-again.gif" 
                  alt="Play Again" 
                  onClick={() => { playClickSound(); resetGame(); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/leaderboard.gif" 
                  alt="View Leaderboard" 
                  onClick={() => { playClickSound(); setShowLeaderboard(true); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/theme.gif" 
                  alt="Change Theme" 
                  onClick={() => { playClickSound(); setShowThemeMenu(true); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/cancel.gif" 
                  alt="Cancel" 
                  onClick={() => {
                    playClickSound();
                    setGameOver(false);
                    setGameStarted(false);
                    setSnake(INITIAL_SNAKE);
                    setScore(0);
                  }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
              </div>
            </div>
          </div>
        )}

        {isPaused && gameStarted && !gameOver && (
          <div className="overlay">
            <div className="message">
              <h2>Paused</h2>
              <p>Press SPACE to continue</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '280px', alignItems: 'center', margin: '20px auto 0'}}>
                <img 
                  src="/buttons/resume.gif" 
                  alt="Resume Game" 
                  onClick={() => { playClickSound(); setIsPaused(false); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/leaderboard.gif" 
                  alt="View Leaderboard" 
                  onClick={() => { playClickSound(); setShowLeaderboard(true); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/theme.gif" 
                  alt="Change Theme" 
                  onClick={() => { playClickSound(); setShowThemeMenu(true); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src={isMusicPlaying ? "/buttons/music-on.gif" : "/buttons/music-off.gif"}
                  alt="Music Toggle" 
                  onClick={() => { playClickSound(); toggleMusic(); }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
                <img 
                  src="/buttons/quit.gif" 
                  alt="Quit Game" 
                  onClick={() => {
                    playClickSound();
                    setGameOver(true);
                    setIsPaused(false);
                  }}
                  onMouseEnter={playHoverSound}
                  style={{cursor: 'pointer', width: '100%', maxWidth: '250px'}}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mobile-controls">
          <div className="control-row">
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: -1 }); }}
              onMouseDown={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: -1 }); }}
              disabled={!gameStarted || gameOver}
            >
              ▲
            </button>
          </div>
          <div className="control-row">
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: -1, y: 0 }); }}
              onMouseDown={(e) => { e.preventDefault(); handleDirectionChange({ x: -1, y: 0 }); }}
              disabled={!gameStarted || gameOver}
            >
              ◄
            </button>
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: 1 }); }}
              onMouseDown={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: 1 }); }}
              disabled={!gameStarted || gameOver}
            >
              ▼
            </button>
            <button 
              className="control-btn"
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 1, y: 0 }); }}
              onMouseDown={(e) => { e.preventDefault(); handleDirectionChange({ x: 1, y: 0 }); }}
              disabled={!gameStarted || gameOver}
            >
              ►
            </button>
          </div>
        </div>


        {showLeaderboard && (
          <div className="overlay">
            <div className="leaderboard-modal">
              <h2 style={{
                fontFamily: "'Press Start 2P', cursive",
                color: '#FFCB05',
                textShadow: '3px 3px 0px #3D7DCA, -2px -2px 0px #3D7DCA, 2px -2px 0px #3D7DCA, -2px 2px 0px #3D7DCA, 2px 2px 0px #3D7DCA'
              }}>Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <div className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <div key={index} className="leaderboard-entry">
                      <span className="rank">#{index + 1}</span>
                      <span className="player-name">{entry.name}</span>
                      <span className="player-score">{entry.score}</span>
                      <span className="player-char">{entry.character}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-scores">No scores yet! Be the first to play!</p>
              )}
              <img 
                src="/buttons/cancel.gif"
                alt="Close"
                onClick={() => { playClickSound(); setShowLeaderboard(false); }}
                onMouseEnter={playHoverSound}
                style={{cursor: 'pointer', width: '100%', maxWidth: '250px', marginTop: '20px', display: 'block', marginLeft: 'auto', marginRight: 'auto'}}
              />
            </div>
          </div>
        )}

        {showGameOverFlash && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
          }}>
            <img 
              src="/gameover.gif" 
              alt="Game Over" 
              style={{
                maxWidth: '80%',
                maxHeight: '60%',
                objectFit: 'contain',
                marginBottom: '30px'
              }}
            />
            <h1 style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '3rem',
              color: '#FFCB05',
              textShadow: '4px 4px 0px #3D7DCA, -2px -2px 0px #3D7DCA, 2px -2px 0px #3D7DCA, -2px 2px 0px #3D7DCA, 2px 2px 0px #3D7DCA',
              letterSpacing: '5px',
              animation: 'pulse 0.5s ease-in-out infinite',
              textAlign: 'center',
              margin: '0 auto',
              width: '100%'
            }}>
              GAME OVER
            </h1>
          </div>
        )}

        <div className="watermark">
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '0.5rem',
          color: '#FFCB05',
          textShadow: '2px 2px 0px #3D7DCA, -1px -1px 0px #3D7DCA',
          padding: '10px'
        }}>
          © 2026 SnakeGameNitruman by PJ Valencia
        </div>
      </div>
    </div>
  );
}

export default App;
