// ─── NuPower P100 display investigation: text only /projects/nupower-p100 shows ─
// Every statement here comes from the investigation's own written records
// (November 2026); anything those records mark as inferred or unconfirmed is
// left out. Nothing from the device or the workstation is quoted: no firmware
// bytes, strings or hashes, no radio names or addresses, no serial numbers,
// local paths or update file names. tests/data.test.mjs fails on the obvious
// shapes of those (a MAC address, a 64-character hash, a Windows path).
//
// The project entry in config.js holds the spec list; this file holds the
// page's own text, so the register and the page cannot disagree.

export const NUPOWER_PATH = '/projects/nupower-p100'

export const NUPOWER = {
  eyebrow: 'Firmware · Display Investigation',
  title: 'NuPower P100 Car Display',
  intro:
    'An aftermarket wireless Android Auto display, investigated through its USB port: a read-only firmware backup, offline reverse engineering, and, after its screen went blank, a bare-metal program that drove the display controller directly. The display still does not work. What the work established is where software stops: the chip was shown generating frames and set up to send them to the panel, and no register on it can show whether they arrive.',

  /* The chain the probe exercised, from the USB link to the glass. `ok` is
     what the evidence supports: true = proven, false = not observable by any
     software means on this chip. The pins carry both, because their
     configuration was read back and their electrical state cannot be. */
  chain: [
    { id: 'fel',     name: 'FEL',     sub: 'USB boot ROM',       checks: [{ ok: true,  text: 'answered over USB' }] },
    { id: 'payload', name: 'Payload', sub: 'RAM-only, Rust',     checks: [{ ok: true,  text: 'ran, reported back' }] },
    { id: 'tcon',    name: 'TCON',    sub: 'display controller', checks: [{ ok: true,  text: 'generating frames' }] },
    { id: 'pins',    name: 'Pins',    sub: '22 RGB outputs',     checks: [{ ok: true,  text: 'set and routed' }, { ok: false, text: 'toggling' }] },
    { id: 'panel',   name: 'Panel',   sub: '1024 × 600 RGB',     checks: [{ ok: false, text: 'accepts signal' }] },
  ],

  /* Two photographs of this unit, from the investigation's own set, approved
     for the site. Cropped and re-encoded from pixels only, so no metadata
     travels with them; the opened-unit crop also leaves out another board
     that was on the bench. Captions name only parts the records identify:
     the paint-marked chip near the SoC is a flash *candidate* there, so it is
     not named here. */
  photos: {
    opened: {
      src: '/nupower-p100-opened.jpg',
      label: 'The unit, opened',
      caption: 'Main board in the rear shell, the 7-inch panel’s back on the right. The wide orange flex is the panel’s own; the thin white ribbon is the touch panel’s.',
      alt: 'Opened car display: a black circuit board with an Allwinner F133-B processor in the rear shell, a speaker above it, and the silver back of the panel on the right joined by an orange flex ribbon',
    },
    board: {
      src: '/nupower-p100-board.jpg',
      label: 'Main board',
      caption: 'The Allwinner F133-B at the top, the microSD slot and USB-C port on the bottom edge. The FEL switcher card goes in that slot; the USB link runs through that port.',
      alt: 'Close-up of the main board: the Allwinner F133-B processor at the top, a microSD card slot and a USB-C port along the bottom edge',
    },
  },

  access: [
    'While its own operating system is running, the unit uses both of its USB ports as hosts, so there is nothing on the laptop side to talk to. The SoC’s boot ROM has a USB recovery mode, FEL, and a microSD card carrying a small boot-time switcher puts the chip into it at power-up. On the laptop, Windows’ own WinUSB driver was bound to that one USB device and nothing else; a driver inventory taken before and after showed no other change.',
    'Reading the source of the usual open-source FEL tool showed that its flash commands write the flash chip’s status register before reading. So the reads used a guarded tool that could send only the identify and read commands. The 16 MiB flash was read three times and all three copies were identical. That became the backup, and every later change to the card or the flash was preceded by a fresh copy of what it was about to overwrite.',
  ],

  offline: [
    'The backup was then taken apart on the laptop. The unit’s settings are a plain-text configuration file with a simple additive checksum, and the unit accepts a replacement from a card through its own update path. The backlight table showed Day already at 100 % duty, with no headroom left in software. Night was raised from 25 to 40 (about 28 % to 43 % duty) by importing a corrected file through that update path, and was confirmed on the unit at 43 %.',
    'The display timing is in the board configuration (sys_config): 1024 × 600 parallel RGB at about 59.8 Hz from a 51 MHz pixel clock. The kernel’s display driver was traced through the RISC-V disassembly, from the panel power-up sequence through the display-controller set-up and the backlight to the start-up logo.',
  ],

  failure: [
    'At low brightness the backlight flickered. Its PWM ran at 1 kHz, and the change raised it to 20 kHz: four bytes in the board configuration, the value and a checksum. The next boot showed a blank screen.',
    'The change was reversed and verified byte for byte. Then everything in the flash below the settings area was returned to the factory image and the factory settings were imported again. Every saved field that had changed held a value from a boot that had shown a picture. The picture did not come back. The screen now shows uniform grey with the backlight on, while the rest of the unit kept working: after the undo it still connected to Android Auto and played audio.',
    'The change and the failure are close in time, but the same window also holds a settings import, card writes and repeated re-plugging, and nothing in the flash or the firmware can show whether the 20 kHz boots had any physical effect. So this write-up does not say what caused it.',
  ],

  probe: [
    'With the firmware’s state ruled out, the remaining question was whether the chip could put any picture on the panel at all. The test was a bare-metal probe of under 2 KB, written in Rust, loaded into the SoC’s on-chip RAM over FEL and run there; it never touches the flash. It skips the firmware, the display engine and the framebuffer, programs the display controller (TCON) directly with the firmware’s own clocks, timing, pin functions, backlight enable and panel-bias settings, asks it for one of its built-in test patterns, and reads every register back.',
    'Before it went near the unit it ran under emulation (Unicorn), against an allowlist of the registers it may write and a check of their final values. The negative controls had to fail, and did: a write outside the allowlist, a pattern number that does not exist, and a clock that never locks.',
  ],

  /* The four runs on the unit, 15 November 2026. */
  runs: [
    { pattern: 'Colour bars', screen: 'Uniform grey' },
    { pattern: 'White',       screen: 'Uniform grey, no change' },
    { pattern: 'Black',       screen: 'Uniform grey, no change' },
    { pattern: 'Grid',        screen: 'Uniform grey, no change' },
  ],
  runsNote:
    'In every run the clock locked, the timing generator was running (its line counter advanced) and there was no FIFO underflow. The one register that differed from the plan is a status register: it reports state and holds no configuration.',
  probeAfter:
    'Full white and full black looked the same. A wrong clock phase or polarity would garble a picture; it would not make white and black identical.',

  review: [
    'Afterwards the probe’s configuration was checked offline, register by register, against two independent sources: Allwinner’s open-source display HAL for this chip family (sun20iw1), and the disassembly of the unit’s own firmware. The pattern source, controller enable, pad select, output buffers, routing to the RGB pins, pin functions, pixel clock and timing all match the HAL. Where the firmware’s code could be traced (the start delay, pad select, output buffers and sync width), it does the same thing. The chip’s user manual could not be obtained, so nothing relies on it.',
    'A few firmware steps were left out of the probe on purpose, and none is in the output path: an interrupt enable, dithering (which leaves full white and full black unchanged), and the display-engine layers that a built-in pattern does not use.',
  ],

  stop: {
    proven:
      'The display controller generated 1024 × 600 frames at the configured timing, and its output stage was configured and routed to the RGB pins exactly as the firmware does it. The pins are proven as register state, not electrically.',
    unobservable:
      'Whether the 22 pins actually toggle at a valid logic level, and whether the panel’s own drivers accept what arrives. No register on this SoC reports either.',
    verdict:
      'That is the stopping point. The display still does not work, and this is not a fix: it is a record of where software runs out. Separating the causes that remain takes hardware measurement, not more code.',
  },
}
