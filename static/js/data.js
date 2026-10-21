

window.SITE = {

  draft: false,

  links: {
    paper: null,
    code: null,
    benchmark: null
  }
};

window.SIMPLE14 = {
  methods: [
    { key: "internvla", name: "InternVLA-M1" },
    { key: "dp", name: "DP" },
    { key: "act", name: "ACT" },
    { key: "egovla", name: "EgoVLA" },
    { key: "pi05", name: "π0.5" },
    { key: "gr00t", name: "GR00T" },
    { key: "psi0", name: "Ψ0", note: "our fine-tuned checkpoint" },
    { key: "uniform", name: "Uniform memory", ours: "control" },
    { key: "wbm", name: "WholeBodyMem", ours: "method" }
  ],
  perLevel: 10,
  tasks: [
    ["T1", "XMovePick", [[0,0,0],[5,3,3],[7,6,3],[3,3,1],[8,6,3],[6,6,4],[9,10,6],[10,10,5],[10,10,7]]],
    ["T2", "BendPickMP", [[4,5,4],[10,9,10],[9,9,9],[6,9,6],[8,8,6],[10,10,9],[10,10,9],[10,10,10],[10,10,10]]],
    ["T3", "Handover", [[0,0,1],[1,1,1],[1,2,2],[2,3,4],[4,2,3],[6,6,7],[7,6,8],[8,7,9],[10,9,9]]],
    ["T4", "TabletopGraspMP", [[6,7,9],[4,4,1],[10,10,8],[6,5,4],[10,10,9],[10,10,8],[10,10,7],[9,10,8],[10,10,9]]],
    ["T5", "XMoveBendPick", [[5,4,4],[0,0,0],[2,2,3],[3,6,6],[0,0,0],[6,2,4],[9,4,4],[8,6,10],[9,9,8]]],
    ["T6", "LocomotionPickBetweenTables", [[0,0,0],[0,1,0],[1,0,0],[1,3,1],[2,0,1],[0,0,0],[4,4,3],[4,5,4],[8,6,7]]],
    ["T7", "PickAndPlaceAndHugContainer", [[0,0,0],[0,0,0],[3,6,6],[1,0,0],[2,3,1],[0,0,0],[4,5,3],[6,4,6],[7,6,5]]],
    ["T8", "OpenFaucet", [[0,0,0],[2,3,6],[0,0,1],[0,0,0],[4,2,0],[0,0,0],[4,2,4],[3,5,3],[8,5,7]]],
    ["T9", "CloseDoor", [[0,0,0],[10,10,10],[10,10,10],[10,8,10],[10,10,9],[10,10,10],[10,10,10],[10,10,10],[10,10,10]]],
    ["T10", "OpenOven", [[8,6,8],[0,0,0],[1,0,1],[5,8,2],[4,3,6],[0,0,1],[5,6,6],[7,8,9],[9,8,10]]],
    ["T11", "OpenTrashCan", [[0,0,0],[4,7,7],[4,4,7],[3,5,4],[7,6,5],[2,3,4],[4,7,7],[7,5,7],[8,7,8]]],
    ["T12", "PushOfficeChair", [[2,3,1],[10,6,8],[9,10,10],[10,9,10],[10,10,6],[5,5,4],[10,10,9],[8,9,10],[9,10,10]]],
    ["T13", "BendHandover", [[5,2,2],[0,0,0],[0,0,0],[3,2,4],[8,9,8],[0,0,0],[10,8,9],[9,9,9],[10,10,10]]],
    ["T14", "BendPick", [[3,0,0],[0,0,0],[0,0,0],[0,1,2],[0,1,2],[0,0,1],[8,7,7],[9,10,7],[9,10,8]]]
  ],

  expectedTotals: [89, 136, 176, 169, 206, 159, 295, 323, 365]
};

window.MEMORY_TASKS = {
  perLevel: 30,
  tasks: [
    { key: "flashpad",  name: "FlashPad",  type: "counting",   chance: 33 },
    { key: "hidemug",   name: "HideMug",   type: "permanence", chance: 33 },
    { key: "shellgame", name: "ShellGame", type: "permanence", chance: 33 },
    { key: "litlamp",   name: "LitLamp",   type: "reference",  chance: 50 },
    { key: "blinkpad",  name: "BlinkPad",  type: "reference",  chance: 33 },
    { key: "touchpad",  name: "TouchPad",  type: "reference",  chance: 33 }
  ],
  methods: [
    { key: "psi0", name: "Ψ0 (no memory)" },
    { key: "uniform", name: "Uniform memory" },
    { key: "wbm", name: "WholeBodyMem" }
  ],

  success: {
    psi0:    { flashpad: [7, 7, 5],    hidemug: [11, 14, 12], shellgame: [7, 11, 7],   litlamp: [11, 6, 4],   blinkpad: [11, 11, 11], touchpad: [3, 11, 8] },
    uniform: { flashpad: [22, 23, 22], hidemug: [12, 20, 15], shellgame: [10, 9, 9],   litlamp: [12, 12, 11], blinkpad: [10, 9, 13],  touchpad: [6, 13, 12] },
    wbm:     { flashpad: [26, 27, 23], hidemug: [21, 20, 20], shellgame: [21, 20, 19], litlamp: [18, 15, 12], blinkpad: [26, 22, 25], touchpad: [26, 25, 26] }
  },

  decision: {
    psi0:    { flashpad: 30, hidemug: 47, shellgame: 33, litlamp: 47, blinkpad: 45, touchpad: 32 },
    uniform: { flashpad: 82, hidemug: 57, shellgame: 35, litlamp: 51, blinkpad: 37, touchpad: 38 },
    wbm:     { flashpad: 97, hidemug: 99, shellgame: 84, litlamp: 100, blinkpad: 87, touchpad: 95 }
  }
};

window.SIMPLE_VIDEOS = [
  ["T1", "XMovePick", "simple_t01_xmovepick", "move forward to pick up the cracker box"],
  ["T2", "BendPickMP", "simple_t02_bendpickmp", "bend to pick up the cracker box"],
  ["T3", "Handover", "simple_t03_handover", "Hand over cracker box from right hand to left hand and place it on the container."],
  ["T4", "TabletopGraspMP", "simple_t04_tabletopgraspmp", "grasp the object on the tabletop."],
  ["T5", "XMoveBendPick", "simple_t05_xmovebendpick", "xmove to the table and bend to pick up the cracker box"],
  ["T6", "LocomotionPickBetweenTables", "simple_t06_locomotionpick", "pick up the cracker box from table1, locomotion to table2, and place on table2."],
  ["T7", "PickAndPlaceAndHugContainer", "simple_t07_hug", "pick up the apple from table1, hug the container, walk to table2, and place on table2."],
  ["T8", "OpenFaucet", "simple_t08_openfaucet", "move forward to the faucet and open it"],
  ["T9", "CloseDoor", "simple_t09_closedoor", "move forward to the door and close it"],
  ["T10", "OpenOven", "simple_t10_openoven", "move forward to the oven and open it"],
  ["T11", "OpenTrashCan", "simple_t11_opentrashcan", "move forward to the trash can and open it"],
  ["T12", "PushOfficeChair", "simple_t12_pushchair", "move forward to the office chair and push it to the table"],
  ["T13", "BendHandover", "simple_t13_bendhandover", "bend the robot and pick up the cracker box, then place it on the container."],
  ["T14", "BendPick", "simple_t14_bendpick", "bend the robot and pick up the cracker box"]
];

window.MEMORY_VIDEOS = [
  ["flashpad", "FlashPad", "Counting", "tag-c", "rollmem_flashpad",
   "Hold the tomato soup can and count the lamp's flashes; then place the tomato soup can on the pad with that number, counting the pads from the left.", [0, 1, 2]],
  ["hidemug", "HideMug", "Permanence", "tag-p", "rollmem_hidemug",
   "Hold the snack box and watch where the mug hides; then place the snack box on the pad in front of that screen's column, counting from the left.", [0, 1, 2]],
  ["shellgame", "ShellGame", "Permanence", "tag-p", "rollmem_shellgame",
   "Watch which cup hides the ball; then pick up the chips can and place it on the pad of that cup's final slot, counting from the left.", [0, 1, 2]],
  ["litlamp", "LitLamp", "Reference", "tag-r", "rollmem_litlamp",
   "Hold the sugar box and watch which lamp lights up; then place the sugar box on the pad with that lamp's colour.", [0, 1, 2]],
  ["blinkpad", "BlinkPad", "Reference", "tag-r", "rollmem_blinkpad",
   "Hold the chips can and watch which pad blinks; then place the chips can on that pad.", [0, 1, 2]],
  ["touchpad", "TouchPad", "Reference", "tag-r", "rollmem_touchpad",
   "Watch the three pads on the table; one of them blinks once. Then touch the pad that blinked with your right hand.", [0, 1, 2]]
];

window.COMPARISONS = [
  { key: "touchpad", task: "TouchPad", verb: "touches pad",
    instruction: "Watch the three pads; one of them blinks once. Then touch the pad that blinked with your right hand.",
    levels: [ { ep: 11, answer: 3, wbm: 3, uniform: 2, psi0: 1 },
              { ep: 30, answer: 1, wbm: 1, uniform: 3, psi0: 2 },
              { ep: 64, answer: 2, wbm: 2, uniform: 3, psi0: 1 } ] },
  { key: "blinkpad", task: "BlinkPad", verb: "places the can on pad",
    instruction: "Hold the chips can and watch which pad blinks; then place the chips can on that pad.",
    levels: [ { ep: 9, answer: 1, wbm: 1, uniform: 3, psi0: 2 },
              { ep: 39, answer: 1, wbm: 1, uniform: 3, psi0: 2 },
              { ep: 63, answer: 1, wbm: 1, uniform: 2, psi0: 2 } ] }
];
