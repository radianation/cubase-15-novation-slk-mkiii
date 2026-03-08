// Novation SL MkIII 61 - SysEx Helper Functions
// Requires constants.js variables to be in scope (loaded by main script)

// ============================================================
// LCD SCREEN FUNCTIONS
// ============================================================

/**
 * Set the screen layout for columns 0-7.
 * @param {object} context - Cubase callback context
 * @param {object} output - MIDI output port
 * @param {number} layout - LAYOUT_EMPTY (0), LAYOUT_KNOB (1), or LAYOUT_BOX (2)
 */
function setScreenLayout(context, output, layout) {
    var msg = SYSEX_HEADER.concat([CMD_SET_LAYOUT, layout, 0xF7]);
    output.sendMidi(context, msg);
}

/**
 * Set text on a screen column.
 * @param {object} context - Cubase callback context
 * @param {object} output - MIDI output port
 * @param {number} column - 0-7 for strip columns, 8 for center screen
 * @param {number} textIndex - Row index (layout-dependent)
 * @param {string} text - Up to 9 chars (18 for notifications)
 */
function setScreenText(context, output, column, textIndex, text) {
    var msg = SYSEX_HEADER.concat([CMD_SET_PROPERTY, column, PROP_TEXT, textIndex]);
    var len = Math.min(text.length, 9);
    for (var i = 0; i < len; i++) {
        msg.push(text.charCodeAt(i));
    }
    msg.push(0x00); // null terminator
    msg.push(0xF7);
    output.sendMidi(context, msg);
}

/**
 * Set color on a screen column using color table index.
 * @param {number} column - 0-7 or 8 for center
 * @param {number} objectIndex - Color object (layout-dependent)
 * @param {number} colorIndex - 0-127 color table index
 */
function setScreenColor(context, output, column, objectIndex, colorIndex) {
    var msg = SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_COLOR, objectIndex, colorIndex, 0xF7
    ]);
    output.sendMidi(context, msg);
}

/**
 * Set color on a screen column using RGB values.
 * @param {number} column - 0-7 or 8 for center
 * @param {number} objectIndex - Color object (layout-dependent)
 * @param {number} r - Red 0-127
 * @param {number} g - Green 0-127
 * @param {number} b - Blue 0-127
 */
function setScreenColorRGB(context, output, column, objectIndex, r, g, b) {
    var msg = SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_RGB, objectIndex, r, g, b, 0xF7
    ]);
    output.sendMidi(context, msg);
}

/**
 * Set the knob value indicator on a screen column (Knob layout only).
 * @param {number} column - 0-7
 * @param {number} value - 0-127
 */
function setScreenValue(context, output, column, value) {
    var msg = SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_VALUE, 0x00, value, 0xF7
    ]);
    output.sendMidi(context, msg);
}

/**
 * Set multiple properties on a column in one SysEx message.
 * More efficient than sending individual messages.
 * @param {number} column - 0-7 or 8
 * @param {Array} properties - Array of {type, index, data} objects
 *   type: PROP_TEXT, PROP_COLOR, PROP_VALUE, PROP_RGB
 *   index: object/text/value index
 *   data: string (for text), number (for color/value), or [r,g,b] (for RGB)
 */
function setScreenProperties(context, output, column, properties) {
    var msg = SYSEX_HEADER.slice();
    for (var p = 0; p < properties.length; p++) {
        var prop = properties[p];
        msg.push(CMD_SET_PROPERTY);
        msg.push(column);
        msg.push(prop.type);
        msg.push(prop.index);
        if (prop.type === PROP_TEXT) {
            var text = prop.data || '';
            var len = Math.min(text.length, 9);
            for (var i = 0; i < len; i++) {
                msg.push(text.charCodeAt(i));
            }
            msg.push(0x00);
        } else if (prop.type === PROP_RGB) {
            msg.push(prop.data[0]);
            msg.push(prop.data[1]);
            msg.push(prop.data[2]);
        } else {
            msg.push(prop.data);
        }
    }
    msg.push(0xF7);
    output.sendMidi(context, msg);
}

/**
 * Show a temporary notification on the center screen.
 * @param {string} line1 - Up to 18 characters
 * @param {string} line2 - Up to 18 characters
 */
function showNotification(context, output, line1, line2) {
    var msg = SYSEX_HEADER.concat([CMD_NOTIFICATION]);
    var l1 = line1 || ' ';
    var l2 = line2 || ' ';
    for (var i = 0; i < l1.length && i < 18; i++) {
        msg.push(l1.charCodeAt(i));
    }
    msg.push(0x00);
    for (var j = 0; j < l2.length && j < 18; j++) {
        msg.push(l2.charCodeAt(j));
    }
    msg.push(0x00);
    msg.push(0xF7);
    output.sendMidi(context, msg);
}

// ============================================================
// LED FUNCTIONS
// ============================================================

/**
 * Set an LED to an RGB color via SysEx.
 * @param {number} ledId - SysEx LED index
 * @param {number} behavior - LED_SOLID (1), LED_FLASH (2), LED_PULSE (3)
 * @param {number} r - Red 0-127
 * @param {number} g - Green 0-127
 * @param {number} b - Blue 0-127
 */
function setLedRGB(context, output, ledId, behavior, r, g, b) {
    var msg = SYSEX_HEADER.concat([
        CMD_SET_LED, ledId, behavior, r, g, b, 0xF7
    ]);
    output.sendMidi(context, msg);
}

/**
 * Set an LED using color table index via standard MIDI.
 * @param {number} ledId - LED index (used as CC number or note)
 * @param {number} colorIndex - 0-127 color table index
 * @param {boolean} isNote - true for pad LEDs (note), false for button LEDs (CC)
 */
function setLedColor(context, output, ledId, colorIndex, isNote) {
    if (isNote) {
        output.sendMidi(context, [0x9F, ledId, colorIndex]);
    } else {
        output.sendMidi(context, [0xBF, ledId, colorIndex]);
    }
}

/**
 * Turn off an LED.
 */
function setLedOff(context, output, ledId) {
    setLedRGB(context, output, ledId, LED_SOLID, 0, 0, 0);
}

// ============================================================
// FULL SCREEN UPDATE HELPERS
// ============================================================

/**
 * Update a full knob strip (text + value + color) in one go.
 * For use with LAYOUT_KNOB.
 * @param {number} column - 0-7
 * @param {string} topLabel - Parameter name (row 1, up to 9 chars)
 * @param {string} topLabel2 - Secondary label (row 2, up to 9 chars)
 * @param {string} valueText - Value display (row 3, up to 9 chars)
 * @param {string} bottomText - Bottom text (row 4, up to 9 chars)
 * @param {number} knobValue - 0-127 for knob position indicator
 * @param {Array} rgb - [r, g, b] color for the strip
 */
function updateKnobStrip(context, output, column, topLabel, topLabel2, valueText, bottomText, knobValue, rgb) {
    setScreenProperties(context, output, column, [
        { type: PROP_TEXT, index: 0, data: topLabel || '' },
        { type: PROP_TEXT, index: 1, data: topLabel2 || '' },
        { type: PROP_TEXT, index: 2, data: valueText || '' },
        { type: PROP_TEXT, index: 3, data: bottomText || '' },
        { type: PROP_VALUE, index: 0, data: knobValue || 0 },
        { type: PROP_RGB, index: 0, data: rgb || RGB.WHITE },
        { type: PROP_RGB, index: 1, data: rgb || RGB.WHITE },
        { type: PROP_RGB, index: 2, data: rgb || RGB.WHITE }
    ]);
}

/**
 * Update the center screen with track info.
 * @param {string} leftRow1 - e.g. track name
 * @param {string} leftRow2 - e.g. track type
 * @param {string} rightRow1 - e.g. page name
 * @param {string} rightRow2 - e.g. subpage name
 * @param {Array} rgb - color for left bar
 */
function updateCenterScreen(context, output, leftRow1, leftRow2, rightRow1, rightRow2, rgb) {
    setScreenProperties(context, output, COL_CENTER, [
        { type: PROP_TEXT, index: 0, data: leftRow1 || '' },
        { type: PROP_TEXT, index: 1, data: leftRow2 || '' },
        { type: PROP_TEXT, index: 2, data: rightRow1 || '' },
        { type: PROP_TEXT, index: 3, data: rightRow2 || '' },
        { type: PROP_RGB, index: 0, data: rgb || RGB.CYAN }
    ]);
}

/**
 * Clear all screens (set empty layout).
 */
function clearAllScreens(context, output) {
    setScreenLayout(context, output, LAYOUT_EMPTY);
}

/**
 * Initialize screens to knob layout with default dim color.
 */
function initKnobLayout(context, output) {
    setScreenLayout(context, output, LAYOUT_KNOB);
    for (var i = 0; i < 8; i++) {
        updateKnobStrip(context, output, i, '', '', '', '', 0, RGB.DIM);
    }
    updateCenterScreen(context, output, 'SL MkIII', 'Cubase', '', '', RGB.CYAN);
}
