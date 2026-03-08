// =============================================================================
// Novation SL MkIII 61 - Cubase Pro 15 MIDI Remote Script
// =============================================================================
// Custom driver for deep integration between the Novation 61SL MkIII
// and Steinberg Cubase Pro 15 via the MIDI Remote API.
//
// Features:
//   - 8 rotary knobs with LCD feedback (parameter names + values)
//   - 8 faders with pickup mode (no value jumps)
//   - Transport controls (play, stop, record, rewind, ff, loop)
//   - Track navigation (left/right, bank next/prev)
//   - 3 rows of soft buttons (mute, solo, rec arm)
//   - 16 pads with RGB LED feedback
//   - Multiple mapping pages: Mixer, Selected Track, Instrument
//   - Full LCD screen updates via SysEx
//   - LED color feedback from track colors
//
// File placement:
//   Documents/Steinberg/Cubase/MIDI Remote/Driver Scripts/Local/
//     Novation/SL_MkIII_61/Novation_SL_MkIII_61.js
//
// Companion files (constants.js, sysex.js) are inlined below since
// the Cubase MIDI Remote API only loads a single entry-point script.
// =============================================================================

// #############################################################################
// INLINE: constants.js
// #############################################################################

var CH = 15;
var SYSEX_HEADER = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0A, 0x01];
var CMD_SET_LAYOUT = 0x01;
var CMD_SET_PROPERTY = 0x02;
var CMD_SET_LED = 0x03;
var CMD_NOTIFICATION = 0x04;
var LAYOUT_EMPTY = 0x00;
var LAYOUT_KNOB = 0x01;
var LAYOUT_BOX = 0x02;
var PROP_TEXT = 0x01;
var PROP_COLOR = 0x02;
var PROP_VALUE = 0x03;
var PROP_RGB = 0x04;
var COL_CENTER = 8;
var LED_SOLID = 0x01;
var LED_FLASH = 0x02;
var LED_PULSE = 0x03;

var KNOB_CC = [21, 22, 23, 24, 25, 26, 27, 28];
var FADER_CC = [41, 42, 43, 44, 45, 46, 47, 48];
var FADER_LED_ID = [54, 55, 56, 57, 58, 59, 60, 61];

var SOFT_BTN_ROW1_CC = [51, 52, 53, 54, 55, 56, 57, 58];
var SOFT_BTN_ROW1_LED = [4, 5, 6, 7, 8, 9, 10, 11];
var SOFT_BTN_ROW2_CC = [59, 60, 61, 62, 63, 64, 65, 66];
var SOFT_BTN_ROW2_LED = [12, 13, 14, 15, 16, 17, 18, 19];
var SOFT_BTN_ROW3_CC = [67, 68, 69, 70, 71, 72, 73, 74];
var SOFT_BTN_ROW3_LED = [20, 21, 22, 23, 24, 25, 26, 27];

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

var PAD_ROW1_NOTE = [96, 97, 98, 99, 100, 101, 102, 103];
var PAD_ROW1_LED = [38, 39, 40, 41, 42, 43, 44, 45];
var PAD_ROW2_NOTE = [112, 113, 114, 115, 116, 117, 118, 119];
var PAD_ROW2_LED = [46, 47, 48, 49, 50, 51, 52, 53];

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

// #############################################################################
// INLINE: sysex.js
// #############################################################################

function setScreenLayout(context, output, layout) {
    output.sendMidi(context, SYSEX_HEADER.concat([CMD_SET_LAYOUT, layout, 0xF7]));
}

function setScreenText(context, output, column, textIndex, text) {
    var msg = SYSEX_HEADER.concat([CMD_SET_PROPERTY, column, PROP_TEXT, textIndex]);
    var len = Math.min(text.length, 9);
    for (var i = 0; i < len; i++) {
        msg.push(text.charCodeAt(i));
    }
    msg.push(0x00, 0xF7);
    output.sendMidi(context, msg);
}

function setScreenColor(context, output, column, objectIndex, colorIndex) {
    output.sendMidi(context, SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_COLOR, objectIndex, colorIndex, 0xF7
    ]));
}

function setScreenColorRGB(context, output, column, objectIndex, r, g, b) {
    output.sendMidi(context, SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_RGB, objectIndex, r, g, b, 0xF7
    ]));
}

function setScreenValue(context, output, column, value) {
    output.sendMidi(context, SYSEX_HEADER.concat([
        CMD_SET_PROPERTY, column, PROP_VALUE, 0x00, value, 0xF7
    ]));
}

function setScreenProperties(context, output, column, properties) {
    var msg = SYSEX_HEADER.slice();
    for (var p = 0; p < properties.length; p++) {
        var prop = properties[p];
        msg.push(CMD_SET_PROPERTY, column, prop.type, prop.index);
        if (prop.type === PROP_TEXT) {
            var text = prop.data || '';
            var len = Math.min(text.length, 9);
            for (var i = 0; i < len; i++) {
                msg.push(text.charCodeAt(i));
            }
            msg.push(0x00);
        } else if (prop.type === PROP_RGB) {
            msg.push(prop.data[0], prop.data[1], prop.data[2]);
        } else {
            msg.push(prop.data);
        }
    }
    msg.push(0xF7);
    output.sendMidi(context, msg);
}

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
    msg.push(0x00, 0xF7);
    output.sendMidi(context, msg);
}

function setLedRGB(context, output, ledId, behavior, r, g, b) {
    output.sendMidi(context, SYSEX_HEADER.concat([
        CMD_SET_LED, ledId, behavior, r, g, b, 0xF7
    ]));
}

function setLedOff(context, output, ledId) {
    setLedRGB(context, output, ledId, LED_SOLID, 0, 0, 0);
}

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

function updateCenterScreen(context, output, leftRow1, leftRow2, rightRow1, rightRow2, rgb) {
    setScreenProperties(context, output, COL_CENTER, [
        { type: PROP_TEXT, index: 0, data: leftRow1 || '' },
        { type: PROP_TEXT, index: 1, data: leftRow2 || '' },
        { type: PROP_TEXT, index: 2, data: rightRow1 || '' },
        { type: PROP_TEXT, index: 3, data: rightRow2 || '' },
        { type: PROP_RGB, index: 0, data: rgb || RGB.CYAN }
    ]);
}

function clearAllScreens(context, output) {
    setScreenLayout(context, output, LAYOUT_EMPTY);
}

function initKnobLayout(context, output) {
    setScreenLayout(context, output, LAYOUT_KNOB);
    for (var i = 0; i < 8; i++) {
        updateKnobStrip(context, output, i, '', '', '', '', 0, RGB.DIM);
    }
    updateCenterScreen(context, output, 'SL MkIII', 'Cubase 15', '', '', RGB.CYAN);
}

// Utility: convert 0.0-1.0 float to 0-127
function floatTo127(value) {
    return Math.round(Math.min(1, Math.max(0, value)) * 127);
}

// Utility: truncate string to max length
function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) : str;
}

// Utility: convert Cubase color (0-1 float) to SysEx RGB (0-127)
function colorToRGB(r, g, b) {
    return [
        Math.round(r * 127),
        Math.round(g * 127),
        Math.round(b * 127)
    ];
}

// =============================================================================
// 1. DRIVER SETUP
// =============================================================================

var midiremote_api = require('midiremote_api_v1');

var deviceDriver = midiremote_api.makeDeviceDriver(
    'Novation',
    'SL MkIII 61',
    'Custom Script'
);

// =============================================================================
// 2. MIDI PORTS
// =============================================================================

var midiInput = deviceDriver.mPorts.makeMidiInput('SL MkIII InControl In');
var midiOutput = deviceDriver.mPorts.makeMidiOutput('SL MkIII InControl Out');

// Auto-detection: Windows port names
var detectionWin = deviceDriver.makeDetectionUnit();
detectionWin.detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('SL MkIII')
    .expectOutputNameContains('SL MkIII');

// =============================================================================
// 3. SURFACE LAYOUT
// =============================================================================

var surface = deviceDriver.mSurface;

// --- 8 Rotary Encoders ---
var knobs = [];
for (var k = 0; k < 8; k++) {
    var knob = surface.makePushEncoder(k, 0, 1, 1);
    knob.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .setOutputPort(midiOutput)
        .bindToControlChange(CH, KNOB_CC[k])
        .setTypeRelativeTwosComplement();
    knobs.push(knob);
}

// --- 8 Faders ---
var faders = [];
for (var f = 0; f < 8; f++) {
    var fader = surface.makeFader(f, 3, 1, 3);
    fader.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .setOutputPort(midiOutput)
        .bindToControlChange(CH, FADER_CC[f]);
    faders.push(fader);
}

// --- Soft Buttons Row 1 (Mute) ---
var muteButtons = [];
for (var m = 0; m < 8; m++) {
    var btn = surface.makeButton(m, 6, 1, 1);
    btn.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToControlChange(CH, SOFT_BTN_ROW1_CC[m]);
    muteButtons.push(btn);
}

// --- Soft Buttons Row 2 (Solo) ---
var soloButtons = [];
for (var s = 0; s < 8; s++) {
    var btn2 = surface.makeButton(s, 7, 1, 1);
    btn2.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToControlChange(CH, SOFT_BTN_ROW2_CC[s]);
    soloButtons.push(btn2);
}

// --- Soft Buttons Row 3 (Rec Arm / Select) ---
var selectButtons = [];
for (var r = 0; r < 8; r++) {
    var btn3 = surface.makeButton(r, 8, 1, 1);
    btn3.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToControlChange(CH, SOFT_BTN_ROW3_CC[r]);
    selectButtons.push(btn3);
}

// --- Transport Buttons ---
function makeTransportButton(x, y, navObj) {
    var btn = surface.makeButton(x, y, 1, 1);
    btn.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToControlChange(CH, navObj.cc);
    return btn;
}

var btnRewind  = makeTransportButton(0, 10, TRANSPORT.REWIND);
var btnFF      = makeTransportButton(1, 10, TRANSPORT.FF);
var btnStop    = makeTransportButton(2, 10, TRANSPORT.STOP);
var btnPlay    = makeTransportButton(3, 10, TRANSPORT.PLAY);
var btnLoop    = makeTransportButton(4, 10, TRANSPORT.LOOP);
var btnRecord  = makeTransportButton(5, 10, TRANSPORT.RECORD);

// --- Navigation Buttons ---
var btnTrackLeft  = makeTransportButton(0, 11, NAV.TRACK_LEFT);
var btnTrackRight = makeTransportButton(1, 11, NAV.TRACK_RIGHT);
var btnScreenUp   = makeTransportButton(2, 11, NAV.SCREEN_UP);
var btnScreenDown = makeTransportButton(3, 11, NAV.SCREEN_DOWN);
var btnSceneTop   = makeTransportButton(4, 11, NAV.SCENE_TOP);
var btnSceneBot   = makeTransportButton(5, 11, NAV.SCENE_BOTTOM);
var btnGrid       = makeTransportButton(6, 11, NAV.GRID);
var btnOptions    = makeTransportButton(7, 11, NAV.OPTIONS);
var btnRightUp    = makeTransportButton(8, 11, NAV.RIGHT_UP);
var btnRightDown  = makeTransportButton(9, 11, NAV.RIGHT_DOWN);
var btnDuplicate  = makeTransportButton(10, 11, NAV.DUPLICATE);
var btnClear      = makeTransportButton(11, 11, NAV.CLEAR);

// --- Pads (2 rows of 8) ---
var padsRow1 = [];
for (var p1 = 0; p1 < 8; p1++) {
    var pad = surface.makeTriggerPad(p1, 12, 1, 1);
    pad.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote(CH, PAD_ROW1_NOTE[p1]);
    padsRow1.push(pad);
}

var padsRow2 = [];
for (var p2 = 0; p2 < 8; p2++) {
    var pad2 = surface.makeTriggerPad(p2, 13, 1, 1);
    pad2.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote(CH, PAD_ROW2_NOTE[p2]);
    padsRow2.push(pad2);
}

// =============================================================================
// 4. MAPPING PAGES
// =============================================================================

// -------------------------------------------------------------------------
// PAGE 1: MIXER
// Knobs = Pan, Faders = Volume, Buttons = Mute/Solo/RecArm per channel
// -------------------------------------------------------------------------

var pageMixer = deviceDriver.mMapping.makePage('Mixer');

var mixerBankZone = pageMixer.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels();

var mixerChannels = [];
for (var ch = 0; ch < 8; ch++) {
    mixerChannels.push(mixerBankZone.makeMixerBankChannel());
}

// Knobs -> Pan
for (var kp = 0; kp < 8; kp++) {
    pageMixer.makeValueBinding(knobs[kp].mSurfaceValue, mixerChannels[kp].mValue.mPan);
}

// Faders -> Volume (with pickup to prevent jumps)
for (var fv = 0; fv < 8; fv++) {
    pageMixer.makeValueBinding(faders[fv].mSurfaceValue, mixerChannels[fv].mValue.mVolume)
        .setValueTakeOverModePickup();
}

// Row 1 -> Mute
for (var bm = 0; bm < 8; bm++) {
    pageMixer.makeValueBinding(muteButtons[bm].mSurfaceValue, mixerChannels[bm].mValue.mMute)
        .setTypeToggle();
}

// Row 2 -> Solo
for (var bs = 0; bs < 8; bs++) {
    pageMixer.makeValueBinding(soloButtons[bs].mSurfaceValue, mixerChannels[bs].mValue.mSolo)
        .setTypeToggle();
}

// Row 3 -> Record Enable
for (var br = 0; br < 8; br++) {
    pageMixer.makeValueBinding(selectButtons[br].mSurfaceValue, mixerChannels[br].mValue.mRecordEnable)
        .setTypeToggle();
}

// Transport bindings (shared across pages via helper)
function bindTransport(page) {
    page.makeValueBinding(btnPlay.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStart)
        .setTypeToggle();
    page.makeValueBinding(btnStop.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStop)
        .setTypeToggle();
    page.makeValueBinding(btnRecord.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRecord)
        .setTypeToggle();
    page.makeValueBinding(btnLoop.mSurfaceValue, page.mHostAccess.mTransport.mValue.mCycleActive)
        .setTypeToggle();
    page.makeValueBinding(btnRewind.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRewind);
    page.makeValueBinding(btnFF.mSurfaceValue, page.mHostAccess.mTransport.mValue.mForward);
}

bindTransport(pageMixer);

// Navigation: Track left/right
pageMixer.makeActionBinding(btnTrackLeft.mSurfaceValue,
    pageMixer.mHostAccess.mTrackSelection.mAction.mPrevTrack);
pageMixer.makeActionBinding(btnTrackRight.mSurfaceValue,
    pageMixer.mHostAccess.mTrackSelection.mAction.mNextTrack);

// Bank navigation: Scene buttons
pageMixer.makeActionBinding(btnSceneTop.mSurfaceValue, mixerBankZone.mAction.mPrevBank);
pageMixer.makeActionBinding(btnSceneBot.mSurfaceValue, mixerBankZone.mAction.mNextBank);

// Screen Up/Down -> Page switching
pageMixer.makeActionBinding(btnScreenUp.mSurfaceValue, deviceDriver.mAction.mPrevPage);
pageMixer.makeActionBinding(btnScreenDown.mSurfaceValue, deviceDriver.mAction.mNextPage);

// -------------------------------------------------------------------------
// LCD FEEDBACK: MIXER PAGE
// -------------------------------------------------------------------------

// Track state for display updates
var mixerTrackNames = ['', '', '', '', '', '', '', ''];
var mixerTrackColors = [];
for (var tc = 0; tc < 8; tc++) {
    mixerTrackColors.push(RGB.DIM.slice());
}

pageMixer.mOnActivate = function (context) {
    initKnobLayout(context, midiOutput);
    showNotification(context, midiOutput, 'Page: Mixer', 'Vol/Pan/Mute/Solo');

    // Light up transport LEDs
    setLedRGB(context, midiOutput, TRANSPORT.PLAY.led, LED_SOLID, 0, 127, 0);
    setLedRGB(context, midiOutput, TRANSPORT.STOP.led, LED_SOLID, 80, 80, 80);
    setLedRGB(context, midiOutput, TRANSPORT.RECORD.led, LED_SOLID, 127, 0, 0);
    setLedRGB(context, midiOutput, TRANSPORT.LOOP.led, LED_SOLID, 0, 80, 127);
    setLedRGB(context, midiOutput, TRANSPORT.REWIND.led, LED_SOLID, 60, 60, 60);
    setLedRGB(context, midiOutput, TRANSPORT.FF.led, LED_SOLID, 60, 60, 60);

    // Light up nav LEDs
    setLedRGB(context, midiOutput, NAV.TRACK_LEFT.led, LED_SOLID, 40, 40, 127);
    setLedRGB(context, midiOutput, NAV.TRACK_RIGHT.led, LED_SOLID, 40, 40, 127);
    setLedRGB(context, midiOutput, NAV.SCENE_TOP.led, LED_SOLID, 127, 80, 0);
    setLedRGB(context, midiOutput, NAV.SCENE_BOTTOM.led, LED_SOLID, 127, 80, 0);
    setLedRGB(context, midiOutput, NAV.SCREEN_UP.led, LED_SOLID, 0, 127, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_DOWN.led, LED_SOLID, 0, 127, 127);
};

// Knob display callbacks (Pan values per channel)
for (var kd = 0; kd < 8; kd++) {
    (function (idx) {
        knobs[idx].mSurfaceValue.mOnTitleChange = function (context, objectTitle, valueTitle) {
            mixerTrackNames[idx] = truncate(objectTitle, 9);
            setScreenText(context, midiOutput, idx, 0, truncate(objectTitle, 9));
            setScreenText(context, midiOutput, idx, 1, truncate(valueTitle, 9));
        };

        knobs[idx].mSurfaceValue.mOnDisplayValueChange = function (context, value, units) {
            setScreenText(context, midiOutput, idx, 2, truncate(value, 9));
            setScreenText(context, midiOutput, idx, 3, truncate(units, 9));
        };

        knobs[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            setScreenValue(context, midiOutput, idx, floatTo127(newValue));
        };

        knobs[idx].mSurfaceValue.mOnColorChange = function (context, r, g, b, a, isActive) {
            if (isActive) {
                var rgb = colorToRGB(r, g, b);
                mixerTrackColors[idx] = rgb;
                setScreenColorRGB(context, midiOutput, idx, 0, rgb[0], rgb[1], rgb[2]);
                setScreenColorRGB(context, midiOutput, idx, 1, rgb[0], rgb[1], rgb[2]);
                setScreenColorRGB(context, midiOutput, idx, 2, rgb[0], rgb[1], rgb[2]);
            }
        };
    })(kd);
}

// Fader display callbacks (Volume per channel)
for (var fd = 0; fd < 8; fd++) {
    (function (idx) {
        faders[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            // Update fader LED strip to reflect volume level
            var level = floatTo127(newValue);
            var rgb = mixerTrackColors[idx] || RGB.WHITE;
            setLedRGB(context, midiOutput, FADER_LED_ID[idx], LED_SOLID,
                Math.round(rgb[0] * newValue),
                Math.round(rgb[1] * newValue),
                Math.round(rgb[2] * newValue));
        };

        faders[idx].mSurfaceValue.mOnDisplayValueChange = function (context, value, units) {
            // Show volume value on bottom row of the knob screen
            setScreenText(context, midiOutput, idx, 3, truncate(value, 9));
        };
    })(fd);
}

// Mute button LED feedback
for (var ml = 0; ml < 8; ml++) {
    (function (idx) {
        muteButtons[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            if (newValue > 0.5) {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW1_LED[idx], LED_SOLID, 127, 80, 0);
            } else {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW1_LED[idx], LED_SOLID, 20, 15, 0);
            }
        };
    })(ml);
}

// Solo button LED feedback
for (var sl = 0; sl < 8; sl++) {
    (function (idx) {
        soloButtons[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            if (newValue > 0.5) {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW2_LED[idx], LED_SOLID, 127, 127, 0);
            } else {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW2_LED[idx], LED_SOLID, 20, 20, 0);
            }
        };
    })(sl);
}

// Rec arm button LED feedback
for (var rl = 0; rl < 8; rl++) {
    (function (idx) {
        selectButtons[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            if (newValue > 0.5) {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW3_LED[idx], LED_SOLID, 127, 0, 0);
            } else {
                setLedRGB(context, midiOutput, SOFT_BTN_ROW3_LED[idx], LED_SOLID, 20, 0, 0);
            }
        };
    })(rl);
}

// -------------------------------------------------------------------------
// PAGE 2: SELECTED TRACK
// Knobs = Quick Controls, Faders = Send Levels
// -------------------------------------------------------------------------

var pageTrack = deviceDriver.mMapping.makePage('Selected Track');
var selectedTrack = pageTrack.mHostAccess.mTrackSelection.mMixerChannel;

// Knobs -> Quick Controls (focused plugin or track QC)
for (var qc = 0; qc < 8; qc++) {
    pageTrack.makeValueBinding(knobs[qc].mSurfaceValue,
        pageTrack.mHostAccess.mFocusedQuickControls.getByIndex(qc));
}

// Faders -> Send Levels (sends 1-8)
for (var fs = 0; fs < 8; fs++) {
    pageTrack.makeValueBinding(faders[fs].mSurfaceValue,
        selectedTrack.mSends.getByIndex(fs).mLevel)
        .setValueTakeOverModePickup();
}

// Row 1 -> Send On/Off
for (var so = 0; so < 8; so++) {
    pageTrack.makeValueBinding(muteButtons[so].mSurfaceValue,
        selectedTrack.mSends.getByIndex(so).mOn)
        .setTypeToggle();
}

// Row 2 -> Mute/Solo for selected track
pageTrack.makeValueBinding(soloButtons[0].mSurfaceValue, selectedTrack.mValue.mMute)
    .setTypeToggle();
pageTrack.makeValueBinding(soloButtons[1].mSurfaceValue, selectedTrack.mValue.mSolo)
    .setTypeToggle();
pageTrack.makeValueBinding(soloButtons[2].mSurfaceValue, selectedTrack.mValue.mMonitorEnable)
    .setTypeToggle();
pageTrack.makeValueBinding(soloButtons[3].mSurfaceValue, selectedTrack.mValue.mRecordEnable)
    .setTypeToggle();

bindTransport(pageTrack);

// Navigation
pageTrack.makeActionBinding(btnTrackLeft.mSurfaceValue,
    pageTrack.mHostAccess.mTrackSelection.mAction.mPrevTrack);
pageTrack.makeActionBinding(btnTrackRight.mSurfaceValue,
    pageTrack.mHostAccess.mTrackSelection.mAction.mNextTrack);
pageTrack.makeActionBinding(btnScreenUp.mSurfaceValue, deviceDriver.mAction.mPrevPage);
pageTrack.makeActionBinding(btnScreenDown.mSurfaceValue, deviceDriver.mAction.mNextPage);

// LCD Feedback: Selected Track page
pageTrack.mOnActivate = function (context) {
    initKnobLayout(context, midiOutput);
    showNotification(context, midiOutput, 'Page: Sel Track', 'QC / Sends');

    setLedRGB(context, midiOutput, TRANSPORT.PLAY.led, LED_SOLID, 0, 127, 0);
    setLedRGB(context, midiOutput, TRANSPORT.STOP.led, LED_SOLID, 80, 80, 80);
    setLedRGB(context, midiOutput, TRANSPORT.RECORD.led, LED_SOLID, 127, 0, 0);
    setLedRGB(context, midiOutput, TRANSPORT.LOOP.led, LED_SOLID, 0, 80, 127);
    setLedRGB(context, midiOutput, NAV.TRACK_LEFT.led, LED_SOLID, 40, 40, 127);
    setLedRGB(context, midiOutput, NAV.TRACK_RIGHT.led, LED_SOLID, 40, 40, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_UP.led, LED_SOLID, 0, 127, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_DOWN.led, LED_SOLID, 0, 127, 127);
};

// QC knob display callbacks
for (var qd = 0; qd < 8; qd++) {
    (function (idx) {
        knobs[idx].mSurfaceValue.mOnTitleChange = function (context, objectTitle, valueTitle) {
            setScreenText(context, midiOutput, idx, 0, truncate(objectTitle, 9));
            setScreenText(context, midiOutput, idx, 1, truncate(valueTitle, 9));
        };

        knobs[idx].mSurfaceValue.mOnDisplayValueChange = function (context, value, units) {
            setScreenText(context, midiOutput, idx, 2, truncate(value, 9));
        };

        knobs[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            setScreenValue(context, midiOutput, idx, floatTo127(newValue));
        };
    })(qd);
}

// -------------------------------------------------------------------------
// PAGE 3: INSTRUMENT / PLUGIN CONTROL
// Knobs = Focused Plugin Quick Controls, Pads = command bindings
// -------------------------------------------------------------------------

var pagePlugin = deviceDriver.mMapping.makePage('Plugin');

// Knobs -> Focused Quick Controls (same as Selected Track but semantically different page)
for (var pc = 0; pc < 8; pc++) {
    pagePlugin.makeValueBinding(knobs[pc].mSurfaceValue,
        pagePlugin.mHostAccess.mFocusedQuickControls.getByIndex(pc));
}

// Faders -> still volume for convenience
var pluginBankZone = pagePlugin.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels();

var pluginChannels = [];
for (var pch = 0; pch < 8; pch++) {
    pluginChannels.push(pluginBankZone.makeMixerBankChannel());
}

for (var pf = 0; pf < 8; pf++) {
    pagePlugin.makeValueBinding(faders[pf].mSurfaceValue, pluginChannels[pf].mValue.mVolume)
        .setValueTakeOverModePickup();
}

bindTransport(pagePlugin);

// Navigation
pagePlugin.makeActionBinding(btnTrackLeft.mSurfaceValue,
    pagePlugin.mHostAccess.mTrackSelection.mAction.mPrevTrack);
pagePlugin.makeActionBinding(btnTrackRight.mSurfaceValue,
    pagePlugin.mHostAccess.mTrackSelection.mAction.mNextTrack);
pagePlugin.makeActionBinding(btnScreenUp.mSurfaceValue, deviceDriver.mAction.mPrevPage);
pagePlugin.makeActionBinding(btnScreenDown.mSurfaceValue, deviceDriver.mAction.mNextPage);

// Pad commands: useful shortcuts
pagePlugin.makeCommandBinding(padsRow1[0].mSurfaceValue, 'Preset', 'Previous');
pagePlugin.makeCommandBinding(padsRow1[1].mSurfaceValue, 'Preset', 'Next');
pagePlugin.makeCommandBinding(padsRow1[2].mSurfaceValue, 'Edit', 'Undo');
pagePlugin.makeCommandBinding(padsRow1[3].mSurfaceValue, 'Edit', 'Redo');
pagePlugin.makeCommandBinding(padsRow1[4].mSurfaceValue, 'Devices', 'Activate Next Plugin');
pagePlugin.makeCommandBinding(padsRow1[5].mSurfaceValue, 'Devices', 'Activate Previous Plugin');
pagePlugin.makeCommandBinding(padsRow1[6].mSurfaceValue, 'Zoom', 'Zoom In');
pagePlugin.makeCommandBinding(padsRow1[7].mSurfaceValue, 'Zoom', 'Zoom Out');

// Row 2 pads: more commands
pagePlugin.makeCommandBinding(padsRow2[0].mSurfaceValue, 'Navigate', 'Left');
pagePlugin.makeCommandBinding(padsRow2[1].mSurfaceValue, 'Navigate', 'Right');
pagePlugin.makeCommandBinding(padsRow2[2].mSurfaceValue, 'Navigate', 'Up');
pagePlugin.makeCommandBinding(padsRow2[3].mSurfaceValue, 'Navigate', 'Down');
pagePlugin.makeCommandBinding(padsRow2[4].mSurfaceValue, 'Transport', 'Metronome On');
pagePlugin.makeCommandBinding(padsRow2[5].mSurfaceValue, 'Quantize', 'Quantize');
pagePlugin.makeCommandBinding(padsRow2[6].mSurfaceValue, 'Editors', 'Open/Close Editor');
pagePlugin.makeCommandBinding(padsRow2[7].mSurfaceValue, 'MixConsole', 'Open/Close MixConsole');

// LCD Feedback: Plugin page
pagePlugin.mOnActivate = function (context) {
    initKnobLayout(context, midiOutput);
    showNotification(context, midiOutput, 'Page: Plugin', 'Quick Controls');

    // Light pads for commands
    setLedRGB(context, midiOutput, PAD_ROW1_LED[0], LED_SOLID, 0, 80, 127);   // Prev Preset
    setLedRGB(context, midiOutput, PAD_ROW1_LED[1], LED_SOLID, 0, 80, 127);   // Next Preset
    setLedRGB(context, midiOutput, PAD_ROW1_LED[2], LED_SOLID, 127, 80, 0);   // Undo
    setLedRGB(context, midiOutput, PAD_ROW1_LED[3], LED_SOLID, 127, 80, 0);   // Redo
    setLedRGB(context, midiOutput, PAD_ROW1_LED[4], LED_SOLID, 0, 127, 80);   // Next Plugin
    setLedRGB(context, midiOutput, PAD_ROW1_LED[5], LED_SOLID, 0, 127, 80);   // Prev Plugin
    setLedRGB(context, midiOutput, PAD_ROW1_LED[6], LED_SOLID, 80, 80, 80);   // Zoom In
    setLedRGB(context, midiOutput, PAD_ROW1_LED[7], LED_SOLID, 80, 80, 80);   // Zoom Out

    setLedRGB(context, midiOutput, PAD_ROW2_LED[0], LED_SOLID, 40, 40, 127);  // Nav Left
    setLedRGB(context, midiOutput, PAD_ROW2_LED[1], LED_SOLID, 40, 40, 127);  // Nav Right
    setLedRGB(context, midiOutput, PAD_ROW2_LED[2], LED_SOLID, 40, 40, 127);  // Nav Up
    setLedRGB(context, midiOutput, PAD_ROW2_LED[3], LED_SOLID, 40, 40, 127);  // Nav Down
    setLedRGB(context, midiOutput, PAD_ROW2_LED[4], LED_SOLID, 127, 0, 127);  // Metronome
    setLedRGB(context, midiOutput, PAD_ROW2_LED[5], LED_SOLID, 127, 127, 0);  // Quantize
    setLedRGB(context, midiOutput, PAD_ROW2_LED[6], LED_SOLID, 0, 127, 0);    // Editor
    setLedRGB(context, midiOutput, PAD_ROW2_LED[7], LED_SOLID, 0, 127, 127);  // MixConsole

    // Transport LEDs
    setLedRGB(context, midiOutput, TRANSPORT.PLAY.led, LED_SOLID, 0, 127, 0);
    setLedRGB(context, midiOutput, TRANSPORT.STOP.led, LED_SOLID, 80, 80, 80);
    setLedRGB(context, midiOutput, TRANSPORT.RECORD.led, LED_SOLID, 127, 0, 0);
    setLedRGB(context, midiOutput, TRANSPORT.LOOP.led, LED_SOLID, 0, 80, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_UP.led, LED_SOLID, 0, 127, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_DOWN.led, LED_SOLID, 0, 127, 127);
};

// Plugin knob display callbacks
for (var pd = 0; pd < 8; pd++) {
    (function (idx) {
        knobs[idx].mSurfaceValue.mOnTitleChange = function (context, objectTitle, valueTitle) {
            setScreenText(context, midiOutput, idx, 0, truncate(objectTitle, 9));
            setScreenText(context, midiOutput, idx, 1, truncate(valueTitle, 9));
        };

        knobs[idx].mSurfaceValue.mOnDisplayValueChange = function (context, value, units) {
            setScreenText(context, midiOutput, idx, 2, truncate(value, 9));
        };

        knobs[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            setScreenValue(context, midiOutput, idx, floatTo127(newValue));
        };

        knobs[idx].mSurfaceValue.mOnColorChange = function (context, r, g, b, a, isActive) {
            if (isActive) {
                var rgb = colorToRGB(r, g, b);
                setScreenColorRGB(context, midiOutput, idx, 0, rgb[0], rgb[1], rgb[2]);
                setScreenColorRGB(context, midiOutput, idx, 1, rgb[0], rgb[1], rgb[2]);
            }
        };
    })(pd);
}

// -------------------------------------------------------------------------
// PAGE 4: EQ
// Knobs cycle through EQ bands, Faders = Volume
// -------------------------------------------------------------------------

var pageEQ = deviceDriver.mMapping.makePage('EQ');
var eqTrack = pageEQ.mHostAccess.mTrackSelection.mMixerChannel;

// SubPages to cycle through EQ parameters
var eqSubArea = pageEQ.makeSubPageArea('EQ Params');
var eqSubGain = eqSubArea.makeSubPage('Gain');
var eqSubFreq = eqSubArea.makeSubPage('Frequency');
var eqSubQ = eqSubArea.makeSubPage('Q');

// EQ Bands 1-4 on knobs 0-3, Bands 5-8 on knobs 4-7
var eqBands = [
    eqTrack.mChannelEQ.mBand1,
    eqTrack.mChannelEQ.mBand2,
    eqTrack.mChannelEQ.mBand3,
    eqTrack.mChannelEQ.mBand4
];

for (var eb = 0; eb < 4; eb++) {
    pageEQ.makeValueBinding(knobs[eb].mSurfaceValue, eqBands[eb].mGain)
        .setSubPage(eqSubGain);
    pageEQ.makeValueBinding(knobs[eb + 4].mSurfaceValue, eqBands[eb].mFreq)
        .setSubPage(eqSubGain);

    pageEQ.makeValueBinding(knobs[eb].mSurfaceValue, eqBands[eb].mFreq)
        .setSubPage(eqSubFreq);
    pageEQ.makeValueBinding(knobs[eb + 4].mSurfaceValue, eqBands[eb].mQ)
        .setSubPage(eqSubFreq);

    pageEQ.makeValueBinding(knobs[eb].mSurfaceValue, eqBands[eb].mQ)
        .setSubPage(eqSubQ);
    pageEQ.makeValueBinding(knobs[eb + 4].mSurfaceValue, eqBands[eb].mGain)
        .setSubPage(eqSubQ);
}

// EQ band on/off via soft buttons row 1
for (var eo = 0; eo < 4; eo++) {
    pageEQ.makeValueBinding(muteButtons[eo].mSurfaceValue, eqBands[eo].mOn)
        .setTypeToggle();
}

// SubPage cycling with Right Up/Down buttons
pageEQ.makeActionBinding(btnRightUp.mSurfaceValue, eqSubArea.mAction.mPrev);
pageEQ.makeActionBinding(btnRightDown.mSurfaceValue, eqSubArea.mAction.mNext);

// Faders still on volume
var eqBankZone = pageEQ.mHostAccess.mMixConsole
    .makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels();

var eqChannels = [];
for (var ec = 0; ec < 8; ec++) {
    eqChannels.push(eqBankZone.makeMixerBankChannel());
}

for (var ef = 0; ef < 8; ef++) {
    pageEQ.makeValueBinding(faders[ef].mSurfaceValue, eqChannels[ef].mValue.mVolume)
        .setValueTakeOverModePickup();
}

bindTransport(pageEQ);

pageEQ.makeActionBinding(btnTrackLeft.mSurfaceValue,
    pageEQ.mHostAccess.mTrackSelection.mAction.mPrevTrack);
pageEQ.makeActionBinding(btnTrackRight.mSurfaceValue,
    pageEQ.mHostAccess.mTrackSelection.mAction.mNextTrack);
pageEQ.makeActionBinding(btnScreenUp.mSurfaceValue, deviceDriver.mAction.mPrevPage);
pageEQ.makeActionBinding(btnScreenDown.mSurfaceValue, deviceDriver.mAction.mNextPage);

pageEQ.mOnActivate = function (context) {
    initKnobLayout(context, midiOutput);
    showNotification(context, midiOutput, 'Page: EQ', 'Gain/Freq/Q');

    setLedRGB(context, midiOutput, TRANSPORT.PLAY.led, LED_SOLID, 0, 127, 0);
    setLedRGB(context, midiOutput, TRANSPORT.STOP.led, LED_SOLID, 80, 80, 80);
    setLedRGB(context, midiOutput, TRANSPORT.RECORD.led, LED_SOLID, 127, 0, 0);
    setLedRGB(context, midiOutput, TRANSPORT.LOOP.led, LED_SOLID, 0, 80, 127);
    setLedRGB(context, midiOutput, NAV.RIGHT_UP.led, LED_SOLID, 127, 127, 0);
    setLedRGB(context, midiOutput, NAV.RIGHT_DOWN.led, LED_SOLID, 127, 127, 0);
    setLedRGB(context, midiOutput, NAV.SCREEN_UP.led, LED_SOLID, 0, 127, 127);
    setLedRGB(context, midiOutput, NAV.SCREEN_DOWN.led, LED_SOLID, 0, 127, 127);
};

eqSubGain.mOnActivate = function (context) {
    showNotification(context, midiOutput, 'EQ Mode', 'Gain + Freq');
};

eqSubFreq.mOnActivate = function (context) {
    showNotification(context, midiOutput, 'EQ Mode', 'Freq + Q');
};

eqSubQ.mOnActivate = function (context) {
    showNotification(context, midiOutput, 'EQ Mode', 'Q + Gain');
};

// EQ knob display callbacks
for (var ed = 0; ed < 8; ed++) {
    (function (idx) {
        knobs[idx].mSurfaceValue.mOnTitleChange = function (context, objectTitle, valueTitle) {
            setScreenText(context, midiOutput, idx, 0, truncate(objectTitle, 9));
            setScreenText(context, midiOutput, idx, 1, truncate(valueTitle, 9));
        };

        knobs[idx].mSurfaceValue.mOnDisplayValueChange = function (context, value, units) {
            setScreenText(context, midiOutput, idx, 2, truncate(value, 9));
        };

        knobs[idx].mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            setScreenValue(context, midiOutput, idx, floatTo127(newValue));
        };
    })(ed);
}
