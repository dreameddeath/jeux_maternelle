import { CrossWord, CrossWordOrientation, CrossWordState } from './crossword';
import { Keyboard } from './keyboard';
import { CustomEventSetup } from './polyfills';
import "./style.css";

CustomEventSetup();
let grid: CrossWord;
let keyb: Keyboard;
window.addEventListener("load", () => {
    grid = new CrossWord([
        {
            start: { x: 0, y: 2 }, orientation: CrossWordOrientation.HORIZONTAL, name: "TROMBONNE",
            img_src: "https://www.musicologie.org/sites/t/i/trombone_01.jpg",
            inplace_image: { x: 0, y: 3, max_height: 1.5 }
        },
        { start: { x: 3, y: 0 }, orientation: CrossWordOrientation.VERTICAL, name: "TAMBOUR" },
        { start: { x: 1, y: 5 }, orientation: CrossWordOrientation.HORIZONTAL, name: "ECUREUIL" },
        {
            start: { x: 7, y: 4 }, orientation: CrossWordOrientation.VERTICAL, name: "PIANO",
            img_src: "https://nebout-hamm.com/wp-content/uploads/2019/01/piano-yamaha-n1x-avantgrand-noir-P.jpg",
            inplace_image: { x: 8, y: 4, max_height: 2 }
        },
        { start: { x: 5, y: 8 }, orientation: CrossWordOrientation.HORIZONTAL, name: "violoncelle" },
        { start: { x: 12, y: 5 }, orientation: CrossWordOrientation.VERTICAL, name: "oiseau" },

    ], {
        square_size: 1.2,
        target: "crossword-drawing",
        target_list: "crossword-list",
        target_current: "crossword-current",
        //text_size: "2rem sans-serif",
        success_color: "green",
        failure_color: "darkred",
        neutral_color: "white",
        selection_color: "red",
        selection_size: 2,
        border_margin: 5,
        img_margin: 3
    });

    keyb = new Keyboard({ target: "keyboard", group_size: 13 }, document.getElementById('crossword-drawing'));

});


