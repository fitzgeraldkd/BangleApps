/*
==========================================================
Simple event based robot controller that enables robot 
to switch into automatic or manual control modes. Behaviours
are controlled via a simple finite state machine.
In automatic mode the
robot will look after itself.  In manual mode, the watch
will provide simple forward, back, left and right commands.
The messages will be transmitted to a partner BLE Espruino
using BLE
Written by Richard Hopkins, May 2020
==========================================================
declare global variables for watch button statuses */
top_btn = false;
middle_btn = false;
left_btn= false; // the left side of the touch screen
right_btn = false; // the right side of the touch screen
bottom_btn = false;

msgNum = 0; // message number

/* 
CONFIGURATION AREA - STATE VARIABLES
declare global variables for the toggle button
statuses; if you add an additional toggle button
you should declare it and initiase it here */

var status_auto = {value: false};
var status_mic = {value: true};
var status_spk = {value: true};

/* trsnsmit message
where
s = first character of state,
o = first three character of object name
v = value of state.object
*/

const transmit = (state,object,status) => {
  msgNum ++;
  msg = {
    n: msgNum.toString().slice(-4),
    s: state.substr(0,4),
    o: object.substr(0,4),
    v: status.substr(0.4),
  };
  message= msg.n + "," + msg.s + "," + msg.o + "," + msg.v;
  NRF.setAdvertising({},{
    showName: false,
    manufacturer: 0x0590,
    manufacturerData: JSON.stringify(message)});
};

/*
CONFIGURATION AREA - ICON DEFINITIONS
Retrieve 30px PNG icons from:
https://icons8.com/icon/set/speak/ios-glyphs
Create icons using:
https://www.espruino.com/Image+Converter
Use compression: true
Transparency:  true
Diffusion: flat
Colours: 16bit RGB
Ouput as: Image Object
Add an additional element to the icons array
with a unique name and the data from the Image Object
*/
const icons = [
  {
    name: "walk",
    data: "gEBAP4B/ALyh7b/YALHfY9tACY55HfYdNHto7pHpIbXbL5fXAD6VlHuYAjHf47/Hf47tHK47LDa45zHc4NHHeILJHeonTO9o9rHf47/eOoB/ANg="
  },
  {
    name: "sit",
    data: "gEBAP4B/AP4BacO4ANHPI/rACp1/Hf49rGtI5/He7n3ACY55HcYAZHf45/Hf45rHe4XHGbI7/Va47zZZrpbHfbtXD5Y/vHcYB/AP4BmA"
  },
  {
    name: "joystick",
    data: "gEBAP4B/AP4BMavIALHPI9vHf47/eP45vHpY5xHo451Hf47/FuYAHHNItHABa33AP6xpAD455HqY7/Hf47/Hd49pHKIB/AP4B/AMwA=="
  },
  {
    name: "left",
    data: "gEBAP4B/AP4BKa9ojHAC5pfHJKDTUsYdZHb6ZfO+I9dABabdLbIBdHf473PP47NJdY7/ePIB/RJop5Ys7t/AP6PvD7o7fP8Y1zTZoHPf/4B/AP4B+A=="
  },
  {
    name: "right",
    data: "gEBAP4B/AP4BKa+oAXDo45hCaqFbUbLBfbbo7bHMojTR7Y5LHa51ZALo75Ov47/FeY77AP4B5WdbF3dv4B/R94fdHb5/jGuabNA57//AP4B/APw="
  },
  {
    name: "forward",
    data:  "gEBAP4B/AKSX5avIALHPI9tACY55HsoAbHPI9fHfZFVGMo7/Hf47/Hf47/Hf47/Hf47/Hf47/Hf47/Hf49XHOIB/ALw="
  },
  {
    name: "backward",
    data:  "gEBAP4B/AKCZ5a/Y7/Hf47/Hf47/Hf47/Hf47/Hf47/Hf47/HfIAfHf491W/L15HMo9THNI9PHNo9LHOI9HHOoB/ALg="
  },
  {
    name: "back",
    data:  "gEBAP4B/AP4B/AKgADHPI71HP45/HP45/HP45/HP45/Hf49/Hv49/Hv49/Hv49/Hv497He4B/AP4B/AJAA=="
  },
  {
    name: "spk_on",
    data:  "gEBAP4B/AP4Bic/YAFPP4v1HrYZRVJo7ZDKp5jMJYvZHaYAHVL4LHACZrhADLBTJKI7dPLI7/Hf47/HeZBVFqZHZRJp1lAJ47LOtZTnHbIZDKLpHNAL69ZANp1tQbY5/AP4B/ANQ"
  },
    {
    name: "spk_off",
    data:  "gEBAPhB7P/o9rFKI9pFKY9tXNYZNHrZXfMaoAHPOZhNF7LdXHpKpZEJpvPDZK1ZAB49NPLo9jHdI9NHd49PHebvxEJY9NI6I7dHpaDXcKqfPHLKjZHcpTjHbIZDKa73JHa4BXGY45xe5Y7zV+o9/Hv49JHe4BEA="
  },
    {
    name: "mic_on",
    data:  "gEBAP4B/AKCZ5a/Y7/Hf47/Hf47/Hf47/GbY7TIcY7/Hf47/Hf47/HdY9NCpp5lCb57fOdYvNeJo91HNrlvHf7tVIdY77AP4BiA="
  },
  {
    name: "mic_off",
    data:  "gEBAP4B/AKCZ5a/Y7/Hf47/Hf47/Hf47/GbY7TIcY7/Wf47/HJZLjHZ45RHrI7NHJYhLHqoZJA54hNHr5lTXL6vPSra5jKbo9REZrLRHa5DTXp47jAA7TTF7INLRqY7fdKavhXKo5te6wA=="
  },
  {
    name: "comms",
    data:  "gEBAP4B+QvbF7ABo7/He49tACI7/Hf47zHtI7jJq47lRqoAVEqY7nHsoAZGJo71HrKxfQaY7bdKo7/Hdqz5B5Y7zHK47RD55FRHao3XHKo7JG7L1NHeJTbHboB/AP4BG"
  },
  {
    name: "dalek",
    data: "gEBAP4B/AP4B/AJMQwQBBGucIoMAkADBhFhAoZBcAAQfJhEgB45BCHYMBjGiB4ZLCK5APDFpphBC5AbEJosY0YfCG4IAEJIYdGFYR5LHJYlEAI0Y4cY8YXMOpQBFlNFlMkOZA7MKII7JOAXkE4T1UERKtFHoxJBABY5QiGiD5kANYTnCiFiWIJVOgDZCOra3FoKxFDKI7hADQ7PkEIaoIHEaKYfJAoKPFAJcIGYIJHkI7UgMY8ZFHC5rVDKIZTCDIJhBA4ILBBoYFHC4QBEBogpBjHDdsJJEAoYAHKoTxWWb5tNWZOiHZRbBHbwtLF5ynBL7wtLjHjd6oAZkHkI5JJKAAZ3TkAjJhALBsJ5K0a/KkLvfkMEFpVhO8hrIU4QLGG4QAzkCdVAP4B/AP4Bb"
  },
  {
    name: "k9",
    data: "gEBAP4B/AP4B/AP4B/AP4B/AKAADIf5N/IaIAJJv5LZLeIARffZNdD5JN/KLYATC65RbAGrHlJ/5P/JuYrRJfovNJf4BdAFJL/Jv5N/Jv5L1Jv5PvJv5L7Jv5PpAGpN/dv5HzAP4B/AP4B/AP4B/AP4B/ALg"
  },
  {
    name: "pawn",
    data: "gEBAP4B/AP4B/AP4BEAA455HuY7/Hf47xAB47/PuI1xPZY7/Hf47/G9Y/zHfIATHPI9nHfYB/AOYAfHf4B/AP4B/APA="
  },
  {
    name: "facerecog",
    data: "gEBAP4BSLuozNH9YpTHsolXPsYfdDraZhELIZhHeLtJELY1VC4Y7HHqoXJABYdNHa5bJDrLvfHfbrPZJI7nGZpdVNJ4lRIpaznRqp1hCq55ZC6IRPd8oPjW8Y5jSr45dEJppNHcIjLHZY5ja6rrhFK45pVqI5rGI4AHHNpx3ANA="
  },
  {
    name: "sleep",
    data: "gEBAP4B/AP4B2ACY7/Quq95HP45/HP4APOdY7fACZfnHcaZZAL45/HP45/E7YAHCaZFZHfbh/HP45/HOoAHHf4B/AP4B/AP4BIA="
  },
  {
    name: "awake",
    data: "gEBAP4B/AKyb7HfIAFHPI77Ov451Hf453Hf453HdoAbHf45/Hf5HrHNY7NHNo7/HO47/HO47HHPJ1/Heo51HfoB/ALg="
  },
  {
    name: "wag_h",
    data: "gEBAP4B/AP4B/AP4B/AP4B/AMwADD+oAFHb4hTHMIlXHMopTHNItPAG47/WfY9tFKY9lEq49hELY7ja8YB/AP4B/AP4B/AP4B/AP4BCA"
  },
  {
    name: "wag_v",
    data: "gEBAP4B/AP4BOafIAHHPI9xAB45vd449rFZIHLHsonJBKa7rGNo7/Hf47/Hf47/Hf47/Hf4xlBKY7hFIoHLQM4rHApK7rAB71xHOo9LHOI9HHOoB/AP4BYA="
  },
  {
    name: "happy",
    data: "gEBAP4B/AP4BKa+oAXHNITfHK4ZtD5JZfHOojZaMYlXHMYnXHfI5nFaYPLaaIRNHf47/d/47/HtInTCZrfZHa4vNABYlVKLI3PbLrzfD7qTXDLaphHMIpLAB45hIKY1pAP4B/AMA"
  },
  {
    name: "sad",
    data: "gEBAP4B/AP4BKa+oAXHNITfHK4ZtD5JZfHOojZaMYlXHMYnXHfI5nFaYPLaaIRNHf47/d/47/CK4njCZ4APHcIVJBbbdTecYjZHr4fdSa4ZbEZ4lNCaY9dAB45hIKY1pAP4B/AMA"
  },
  {
    name: "hover",
    data: "gEBAP4B/AP7NedL4fZK7ojNHeJ35DJI7vC5Y7tVMI7XHNYnNYro7hHKI7lAK47/HdoAhHPI7/Hf47/Hf4AtHPI7/Hf47/Hd45LAP4B/ANwA="
  },
  {
    name: "light",
    data: "gEBAP4B/APi/Na67lfACZ/nNaI9lE6o9jEbI9hD7Y7dDsJZ3D6YRJHdIJHHfaz7Hf5Z/Hf4hZHMIjFEqIVVHsY5hDpI7TEqL1jVsqlTdM55THOJvHOuY7/HfI9JHOI9HHOoBgA=="
  },
  {
    name: "speak",
    data: "gEBAP4B/AP4BIbO4AXG+4/hAEY55HqoArHPI9PHfIAzHf47/Hf47/HeY9xHJI79Hto5NHtY5RHc45THco5VHcI3XHJpHRG7I7LEro5ZG+IB/AP4BwA=="
  }
  ];

/* finds icon data by name in the icon array and returns an image object*/
const drawIcon = (name) => {
  for (var icon of icons) {
    if (icon.name == name) {
      image = {
        width : 30, height : 30, bpp : 16,
        transparent : 1,
        buffer: require("heatshrink").decompress(atob(icon.data))
        };
      return image;}
    }
};

/*
CONFIGURATION AREA - BUTTON DEFINITIONS
for a simple button, just define a primary colour
and an icon name from the icon array and
the text to display beneath the button
for toggle buttons, additionally provide secondary
colours, icon name and text. Also provide a reference
to a global variable for the value of the button.
The global variable should be declared at the start of
the program and it may be adviable to use the 'status_name'
format to ensure it is clear.
*/
var joystickBtn = {
  primary_colour: 0x653E,
  primary_icon: 'joystick',
  primary_text: 'Joystick',
  };

var turnLeftBtn = {
  primary_colour: 0x653E,
  primary_text: 'Left',
  primary_icon: 'left',
  };

var turnRightBtn = {
  primary_colour: 0x33F9,
  primary_text: 'Right',
  primary_icon: 'right',
  };

var k9Btn = {
  primary_colour: 0x653E,
  primary_text: 'K9',
  primary_icon: 'k9',
  };

var dalekBtn = {
  primary_colour: 0x33F9,
  primary_text: 'Dalek',
  primary_icon: 'dalek',
  };

var tailHBtn = {
  primary_colour: 0x653E,
  primary_text: 'Wag Tail',
  primary_icon: 'wag_h',
  };

var tailVBtn = {
  primary_colour: 0x33F9,
  primary_text: 'Wag Tail',
  primary_icon: 'wag_v',
  };

var happyBtn = {
  primary_colour: 0x653E,
  primary_text: 'Speak',
  primary_icon: 'happy',
  };

var sadBtn = {
  primary_colour: 0x33F9,
  primary_text: 'Speak',
  primary_icon: 'sad',
  };

var speakBtn = {
  primary_colour: 0x33F9,
  primary_text: 'Speak',
  primary_icon: 'speak',
  };

var faceBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'facerecog',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'facerecog',
  value: status_face
  };

var chessBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'pawn',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'pawn',
  value: status_chess
  };

var irisLightBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'light',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'light',
  value: status_iris_light
  };

var irisBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Closed',
  primary_icon: 'sleep',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'Open',
  secondary_icon : 'awake',
  value: status_iris
  };

var wakeBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Sleeping',
  primary_icon: 'sleep',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'Awake',
  secondary_icon : 'awake',
  value: status_wake
  };

var hoverBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'hover',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'hover',
  value: status_hover
  };

var autoBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Stop',
  primary_icon: 'sit',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'Move',
  secondary_icon : 'walk',
  value: status_auto
  };

var micBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'mic_off',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'mic_on',
  value: status_mic
  };

var spkBtn = {
  primary_colour: 0xE9C7,
  primary_text: 'Off',
  primary_icon: 'spk_off',
  toggle: true,
  secondary_colour: 0x3F48,
  secondary_text: 'On',
  secondary_icon : 'spk_on',
  value: status_spk
  };

/*
CONFIGURATION AREA - SCREEN DEFINITIONS
a screen can have a button (as defined above)
on the left and/or the right of the screen.
in adddition a screen can optionally have
an icon for each of the three buttons on
the left hand side of the screen.  These
are defined as btn1, bt2 and bt3.  The
values are names from the icon array.
*/
const menuScreen = {
  left: k9Btn,
  right: dalekBtn,
};

const k9MenuScreen = {
  left: wakeBtn,
  right: joystickBtn,
  btn1: "pawn",
  btn2: "wag_h",
  btn3: "back"
};

const joystickScreen = {
  left: turnLeftBtn,
  right: turnRightBtn,
  btn1: "forward",
  btn2: "backward",
  btn3: "back"
};

const tailScreen = {
  left: tailHBtn,
  right: tailVBtn,
  btn3: "back"
};

const commsScreen = {
  left: micBtn,
  right: spkBtn,
  btn3: "back"
};

const dalekMenuScreen = {
  left: faceBtn,
  right: speakBtn,
  btn1: "hover",
  btn2: "light",
  btn3: "back"
};

const speakScreen = {
  left: happyBtn,
  right: sadBtn,
  btn3: "back"
};

const irisScreen = {
  left: irisBtn,
  right: irisBirisLightBtn,
  btn3: "back"
};

const lightsScreen = {
  left: hoverBtn,
  right: spkBtn,
  btn3: "back"
};

const chessScreen = {
  left: chessBtn,
  right: autoBtn,
  btn3: "back"
};

/* base state definition 
Each of the screens correspond to a state;
this class provides a constuctor for each 
of the states
*/
class State {
  constructor(params) {
    this.state = params.state;
    this.events = params.events;
    this.screen = params.screen;
  }
}

/*
CONFIGURATION AREA - BUTTON BEHAVIOURS/STATE TRANSITIONS
This area defines how each screen behaves.
Each screen corresponds to a different State of the
state machine.  This makes it much easier to isolate
behaviours between screens.
The state value is transmitted whenever a button is pressed
to provide context (so the receiving device, knows which
button was pressed on which screen).
The screens are defined above.
The events section identifies if a particular button has been
pressed and released on the screen and an action can then be taken.
The events function receives a notification from a mySetWatch which
provides an event object that identifies which button and whether
it has been pressed down or released.  Actions can then be taken.
The events function will always return a State object.
If the events function returns different State from the current
one, then the state machine will change to that new State and redrsw
the screen appropriately.
To add in additional capabilities for button presses, simply add
an additional 'if' statement.
For toggle buttons, the value of the sppropiate status object is
inversed and the new value transmitted.
*/

/* The Home State/Page is where the application beings */
const Home = new State({
  state: "Home",
  screen: menuScreen,
  events: (event) => {
    if ((event.object == "right") && (event.status == "end")) {
      return DalekMenu;
      }
    if ((event.object == "left") && (event.status == "end")) {
      //status_auto.value = !status_auto.value;
      //transmit(this.state, "auto", onOff(status_auto.value));
      //return this;
      return K9Menu;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const K9Menu = new State({
  state: "K9Menu",
  screen: k9MenuScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return Home;
      }
    if ((event.object == "right") && (event.status == "end")) {
      return Joystick;
      }
    if ((event.object == "left") && (event.status == "end")) {
      status_wake.value = !status_wake.value;
      transmit(this.state, "auto", onOff(status_wake.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const DalekMenu = new State({
  state: "DalekMenu",
  screen: dalekMenuScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return Home;
      }
    if ((event.object == "right") && (event.status == "end")) {
      return Speak;
      }
    if ((event.object == "left") && (event.status == "end")) {
      status_face.value = !status_face.value;
      transmit(this.state, "face", onOff(status_face.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const Speak = new State({
  state: "Speak",
  screen: speakScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return DalekMenu;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const Chess = new State({
  state: "Chess",
  screen: chessScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return K9Menu;
      }
    if ((event.object == "right") && (event.status == "end")) {
      status_auto.value = !status_auto.value;
      transmit(this.state, "follow", onOff(status_auto.value));
      return this;
      }
    if ((event.object == "left") && (event.status == "end")) {
      status_chess.value = !status_chess.value;
      transmit(this.state, "chess", onOff(status_chess.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const Tail = new State({
  state: "Tail",
  screen: tailScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return K9Menu;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const Speak = new State({
  state: "Speak",
  screen: speakScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return DalekMenu;
      }
    transmit(this.state, event.object, event.status);
    return this;
    }
});

const Iris = new State({
  state: "Iris",
  screen: irisScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return DalekMenu;
      }
    if ((event.object == "right") && (event.status == "end")) {
      status_iris_light.value = !status_iris_light.value;
      transmit(this.state, "iris_light", onOff(status_iris_light.value));
      return this;
      }
    if ((event.object == "left") && (event.status == "end")) {
      status_iris.value = !status_iris.value;
      transmit(this.state, "iris_servo", onOff(status_iris.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
    } 
});

const Lights = new State({
  state: "Lights",
  screen: lightsScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
      return DalekMenu;
      }
    if ((event.object == "right") && (event.status == "end")) {
      status_spk.value = !status_spk.value;
      transmit(this.state, "iris_light", onOff(status_spk.value));
      return this;
      }
    if ((event.object == "left") && (event.status == "end")) {
      status_hover.value = !status_hover.value;
      transmit(this.state, "hover", onOff(status_hover.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
    } 
});


/* Joystick page state */
const Joystick = new State({
  state: "Joystick",
  screen: joystickScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
        transmit("Joystick", "joystick", "off");
        return Home;
        }
    transmit(this.state, event.object, event.status);
    return this;
  }
});

/* Comms page state */
const Comms = new State({
  state: "Comms",
  screen: commsScreen,
  events: (event) => {
    if ((event.object == "bottom") && (event.status == "end")) {
        return Home;
        }
    if ((event.object == "left") && (event.status == "end")) {
      status_mic.value = !status_mic.value;
      transmit(this.state, "mic", onOff(status_mic.value));
      return this;
      }
    if ((event.object == "right") && (event.status == "end")) {
      status_spk.value = !status_spk.value;
      transmit(this.state, "spk", onOff(status_spk.value));
      return this;
      }
    transmit(this.state, event.object, event.status);
    return this;
  }
});

/* translate button status into english */
const startEnd = status => status ? "start" : "end";

/* translate status into english */
const onOff= status => status ? "on" : "off";


/* create watching functions that will change the global
button status when pressed or released 
This is actuslly the hesrt of the program.  When a button
is not being pressed, nothing is happening (no loops).
This makes the progrsm more battery efficient.
When a setWatch event is raised, the custom callbacks defined
here will be called.  These then fired as events to the current
state/screen of the state mschine.
Some events, will result in the stste of the state machine
chsnging, which is why the screen is redrswn after each 
button press.
*/
const setMyWatch = (params) => {
  setWatch(() => {
  params.bool=!params.bool;
  machine = machine.events({object: params.label, status: startEnd(params.bool)});
  drawScreen(machine.screen);
  }, params.btn, {repeat:true, edge:"both"});
};

/* object array used to set up the watching functions
*/
const buttons = [
  {bool : bottom_btn, label : "bottom",btn : BTN3},
  {bool : middle_btn, label : "middle",btn : BTN2},
  {bool : top_btn, label : "top",btn : BTN1},
  {bool : left_btn, label : "left",btn : BTN4},
  {bool : right_btn, label : "right",btn : BTN5}
  ];

/* set up watchers for buttons */
for (var button of buttons)
  {setMyWatch(button);}

/* Draw various kinds of buttons */
const drawButton = (params,side) => {
    g.setFontAlign(0,1);
    icon = drawIcon(params.primary_icon);
    text = params.primary_text;
    g.setColor(params.primary_colour);
    const x = (side == "left") ? 0 : 120;
    if ((params.toggle) && (params.value.value)) {
        g.setColor(params.secondary_colour);
        text = params.secondary_text;
        icon = drawIcon(params.secondary_icon);
    }
    g.fillRect(0+x,24,119+x, 239);
    g.setColor(0x000);
    g.setFont("Vector",15);
    g.setFontAlign(0,0.0);
    g.drawString(text,60+x,160);
    options = {rotate: 0, scale:2};
    g.drawImage(icon,x+60,120,options);
};

/* Draw the pages corresponding to the states */
const drawScreen = (params) => {
  drawButton(params.left,'left');
  drawButton(params.right,'right');
  g.setColor(0x000);
  if (params.btn1) {g.drawImage(drawIcon(params.btn1),210,40);}
  if (params.btn2) {g.drawImage(drawIcon(params.btn2),210,125);}
  if (params.btn3) {g.drawImage(drawIcon(params.btn3),210,195);}
};

machine = Home; // instantiate the state machine at Home
Bangle.drawWidgets(); // draw active widgets
drawScreen(machine.screen); // draw the screen