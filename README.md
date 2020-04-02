#DEPRECATED

# Simple Leveled Arduino Sonar Mapping Robot

Please feel free to contact us if you see any errors or would like to make a suggestion. Also note that the project is designed to be prepared in a very simple way.*

## The goal of the project

The project is based on two basic requirements.

 - Draw a three-dimensional model of an empty room
 - Calculate the square meters of the room

## The way we prefer
This project is based on the simple C ++ syntax of Arduino and the compatibility of JavaScript on the software side. The Node.js connection is active between these two platforms and this connection works on Serial Communication principles. Arduino scans the room with ultrasonic sounds and processes the data obtained by transferring it to the computer via Serial Communication.


## Requirements to run project
Hardvare side requirements listed:

| Module name|Quantity | 
|--|--|
|Adafruit Motor Shield V1 (Depreceted)  |  x1|
|Arduino  |  x1|
|HCSR-04 Ultrasonic Sensor|  x1|
|Mini Tower Servo Motor|  x1|
|DC Motor  |  x2|
|Wheel|  x2|
|Drunk Wheel|  x1|
|6V Battery Bay|  x1|

Please note that brand and model numbers can be changed. You can use other models if you want.


Software side requirements listed:

 - Node.js installed on computer (Version doesn't matter)
 - Arduino IDE

Library side requirements:

|Name  |Platform  |
|--|--|
|AFMotor.h (Depreceted)  | Arduino |
|Babylon.js  | JavaScript|
|Node.js  | JavaScript|
|NewPing.h  | Arduino|
|Servo.h  | Arduino|
|SerialPort  | JavaScript(Node.js)|


 Pin numbers are listed:
 
|Name| Pin Number  | Piece
|--|--|--|
| TRIGGER_PIN | 14 | HCSR-04
| ECHO_PIN| 15| HCSR-04
| SERVO| 9| TOWER SERVO
| rightMotor| 2| DC-Motor 2
| leftMotor| 1| DC-Motor 1


