// src/main.js - Web application entry point
import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
