// Novation SL MkIII 61 - Constants
// All CC, Note, and SysEx ID mappings for InControl mode

// InControl MIDI Channel (0-indexed)
var CH = 15; // Channel 16

// SysEx Header
var SYSEX_HEADER = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0A, 0x01];

// SysEx Commands
var CMD_SET_LAYOUT = 0x01;
var CMD_SET_PROPERTY = 0x02;
var CMD_SET_LED = 0x03;
var CMD_NOTIFICATION = 0x04;

// Screen Layouts
var LAYOUT_EMPTY = 0x00;
var LAYOUT_KNOB = 0x01;
var LAYOUT_BOX = 0x02;

// Screen Property Types
var PROP_TEXT = 0x01;
var PROP_COLOR = 0x02;
var PROP_VALUE = 0x03;
var PROP_RGB = 0x04;

// Screen Column Indices
var COL_CENTER = 8;

// LED Behavior
var LED_SOLID = 0x01;
var LED_FLASH = 0x02;
var LED_PULSE = 0x03;

// --- Rotary Knobs (CC, relative two's complement) ---
var KNOB_CC = [21, 22, 23, 24, 25, 26, 27, 28];

// --- Faders (CC, absolute 0-127) ---
var FADER_CC = [41, 42, 43, 44, 45, 46, 47, 48];
var FADER_LED_ID = [54, 55, 56, 57, 58, 59, 60, 61];

// --- Soft Buttons Row 1 (above faders) ---
var SOFT_BTN_ROW1_CC = [51, 52, 53, 54, 55, 56, 57, 58];
var SOFT_BTN_ROW1_LED = [4, 5, 6, 7, 8, 9, 10, 11];

// --- Soft Buttons Row 2 ---
var SOFT_BTN_ROW2_CC = [59, 60, 61, 62, 63, 64, 65, 66];
var SOFT_BTN_ROW2_LED = [12, 13, 14, 15, 16, 17, 18, 19];

// --- Soft Buttons Row 3 ---
var SOFT_BTN_ROW3_CC = [67, 68, 69, 70, 71, 72, 73, 74];
var SOFT_BTN_ROW3_LED = [20, 21, 22, 23, 24, 25, 26, 27];

// --- Navigation / Transport ---
var NAV = {
    SCREEN_UP:    { cc: 81, led: 62 },
    SCREEN_DOWN:  { cc: 82, led: 63 },
    SCENE_TOP:    { cc: 83, led: 2 },
    SCENE_BOTTOM: { cc: 84, led: 3 },
    PADS_UP:      { cc: 85, led: 0 },
    PADS_DOWN:    { cc: 86, led: 1 },
    RIGHT_UP:     { cc: 87, led: 28 },
    RIGHT_DOWN:   { cc: 88, led: 29 },
    GRID:         { cc: 89, led: 64 },
    OPTIONS:      { cc: 90, led: 65 },
    SHIFT:        { cc: 91, led: -1 },
    DUPLICATE:    { cc: 92, led: 66 },
    CLEAR:        { cc: 93, led: 67 },
    TRACK_LEFT:   { cc: 102, led: 30 },
    TRACK_RIGHT:  { cc: 103, led: 31 }
};

var TRANSPORT = {
    REWIND:  { cc: 112, led: 33 },
    FF:      { cc: 113, led: 34 },
    STOP:    { cc: 114, led: 35 },
    PLAY:    { cc: 115, led: 36 },
    LOOP:    { cc: 116, led: 37 },
    RECORD:  { cc: 117, led: 32 }
};

// --- Pads (Note messages, velocity-sensitive) ---
var PAD_ROW1_NOTE = [96, 97, 98, 99, 100, 101, 102, 103];
var PAD_ROW1_LED = [38, 39, 40, 41, 42, 43, 44, 45];

var PAD_ROW2_NOTE = [112, 113, 114, 115, 116, 117, 118, 119];
var PAD_ROW2_LED = [46, 47, 48, 49, 50, 51, 52, 53];

// --- Common Colors (color table indices) ---
var COLOR = {
    OFF:     0,
    RED:     5,
    ORANGE:  9,
    YELLOW:  13,
    GREEN:   21,
    CYAN:    33,
    BLUE:    41,
    PURPLE:  49,
    PINK:    53,
    WHITE:   3
};

// --- Common RGB Values (0-127 range) ---
var RGB = {
    OFF:     [0, 0, 0],
    RED:     [127, 0, 0],
    GREEN:   [0, 127, 0],
    BLUE:    [0, 0, 127],
    CYAN:    [0, 127, 127],
    YELLOW:  [127, 127, 0],
    ORANGE:  [127, 64, 0],
    PURPLE:  [80, 0, 127],
    WHITE:   [127, 127, 127],
    DIM:     [20, 20, 20]
};
