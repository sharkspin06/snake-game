# Snake Game

A classic Snake game built with React and Vite.

## Features

- 🎮 Classic snake gameplay
- 🎨 Modern, beautiful UI with gradient design
- ⌨️ Keyboard controls (Arrow keys)
- ⏸️ Pause functionality (Spacebar)
- 📊 Score tracking
- 🔄 Restart game option
- 🎭 Customizable Pokemon heads (6 built-in options)
- 📤 Upload your own image (PNG, JPG, SVG, etc.) for custom snake head

## How to Play

1. Press **SPACE** to start the game
2. Use **Arrow Keys** to control the snake direction
3. Eat the red food to grow and increase your score
4. Avoid hitting the walls or yourself
5. Press **SPACE** to pause/resume during gameplay

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

- **Arrow Keys**: Move the snake (Up, Down, Left, Right)
- **Spacebar**: Start game / Pause / Resume

## Customization

### Choose a Pokemon Head
Click the Pokemon selector button to choose from 6 different Pokemon:
- ⚡ Pikachu
- 🔥 Charmander
- 💧 Squirtle
- 🌿 Bulbasaur
- 🦊 Eevee
- 🎵 Jigglypuff

### Add Your Own PNG Images to the Game

**Method 1: Add to Heads Folder (Permanent)**
1. Place your PNG/JPG/SVG images in the `public/heads/` folder
2. Edit `public/heads/heads-config.json` and add your filenames to the array
3. Restart the dev server
4. Your images will appear as selectable options in the Pokemon menu!

Example `heads-config.json`:
```json
{
  "heads": [
    "pikachu.png",
    "mycharacter.png",
    "dragon.png"
  ]
}
```

**Method 2: Upload Temporarily**
1. Click the Pokemon selector button
2. Select "Upload Image" option
3. Choose any image file from your computer (PNG, JPG, SVG, GIF, WebP, etc.)
4. Your custom image will appear as the snake head for this session!

**Supported formats:** PNG, JPG, JPEG, SVG, GIF, WebP, and more

**Note:** You can only change the snake head before starting a game or after game over.

## Game Rules

- Each food eaten increases your score by 10 points
- The snake grows longer with each food consumed
- Game ends if you hit the wall or collide with yourself
- Try to achieve the highest score possible!

## Technologies Used

- React 18
- Vite
- CSS3 with animations
- Modern ES6+ JavaScript

Enjoy the game! 🐍
