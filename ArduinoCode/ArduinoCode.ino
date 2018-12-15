#include <Servo.h>
#include <NewPing.h>
#include <AFMotor.h>

Servo servo;

int currentAngleGlobal = 0;
int currentPosX = 0;
int currentPosY = 0;

int locations[] = {};
int index = 0;

bool isSerialUnplug = true;

bool isAnyObstaclePoint = true;

#define TRIGGER_PIN  14  // Arduino pin tied to trigger pin on the ultrasonic sensor.
#define ECHO_PIN     15  // Arduino pin tied to echo pin on the ultrasonic sensor.
#define MAX_DISTANCE 400 // Maximum distance we want to ping for (in centimeters). Maximum sensor distance is rated at 400-500cm.

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE); // NewPing setup of pins and maximum distance.

/*
  Thanks to AFMotor.h, DC motors can be controlled via a single port.
*/
AF_DCMotor rightMotor(2);
AF_DCMotor leftMotor(1);

void setup() {
  servo.attach(9);
  servo.write(0);
  
  /*
    Set base speed to 200 rpm.
    We have to use our battery power more efficienty.
  */
  rightMotor.setSpeed(200); 
  leftMotor.setSpeed(200);
  
  /*
    RELEASE means in AFMotor.h library "Get ready motor to move."
  */
  rightMotor.run(RELEASE);
  leftMotor.run(RELEASE);
  
  Serial.begin(9600); 
  // Open serial monitor at 9600 baud.
}

void loop() {
  while(isAnyObstaclePoint == true){
      String dir = determineDirection();
      
      if(dir == "DIRECT"){
        saveData(0, sonar.ping_cm());
      } else if (dir == "RIGHT") {
        saveData(sonar.ping_cm(), 0);
      } else if (dir == "LEFT") {
        saveData(-sonar.ping_cm(), 0);
        //The reason for "-" is that we imagine the robot on the x-y coordinate.
      } else {
        //If there is no movement field, run the code again.
        asm volatile("jmp 0");
      }
      
      goForward();
      if(determineFuture() == true) {
        isAnyObstaclePoint = false;
      }
  }
  
  while(isSerialUnplug == true){
    if(Serial){
      isSerialUnplug == false;
    }
  }

  if(Serial){
    for(int i = 0; i < sizeof(locations); i++) {
      Serial.write(locations[i]);
      /*
      The real trouble is here. Serial.write () does not have the ability to send the entire array at a time.
      That's why we send each data separately.
      */    
    }
    delay(5000);
  }
}

void setSonarDirectionLEFT(int currentAngle){
  if(currentAngle != 0) {
      for(int angle= currentAngle; angle > 0; angle--){
        servo.write(angle);
        currentAngleGlobal--;
        delay(10);
      }
  }
}

void setSonarDirectionRIGHT(int currentAngle){
  if(currentAngle != 180) {
      for(int angle= currentAngle; angle > 180; angle++){
        currentAngleGlobal++;
        servo.write(angle);
        delay(10);
      }
  }
}

void setSonarDirectionPERPENDICULAR(int currentAngle){
  if(currentAngle < 90) {
      for(int angle= currentAngle; angle < 90; angle++){
        currentAngleGlobal++;
        servo.write(angle);
        delay(10);
      }
  } else if (currentAngle > 90) {
      for(int angle= currentAngle; angle > 90; angle--){
        currentAngleGlobal++;
        servo.write(angle);
        delay(10);
      }
  }
}

void goForward(){
  while(isFreeToMove(sonar.ping_cm())){
    rightMotor.run(FORWARD);
    leftMotor.run(FORWARD);
    Serial.println("Forvard");
  }
}

void turnLeft(){
  Serial.println("Left");
  rightMotor.run(FORWARD);
  leftMotor.run(BACKWARD);
  delay(1500);
  rightMotor.run(RELEASE);
  leftMotor.run(RELEASE);
}

void turnRight(){
  Serial.println("Right");
  rightMotor.run(BACKWARD);
  leftMotor.run(FORWARD);
  delay(1500);
  rightMotor.run(RELEASE);
  leftMotor.run(RELEASE);
}

bool isFreeToMove(int distance){
  if(distance > 5) {
    return true;
  } 
  return false;
}

String determineDirection(){
  setSonarDirectionPERPENDICULAR(currentAngleGlobal);
  if(isFreeToMove(sonar.ping_cm())){
    return "DIRECT";
  }

  setSonarDirectionLEFT(currentAngleGlobal);
  if(isFreeToMove(sonar.ping_cm())) {
    turnLeft();
    return "LEFT";
  }

  setSonarDirectionRIGHT(currentAngleGlobal);
  if(isFreeToMove(sonar.ping_cm())) {
    turnRight();
    return "RIGHT";
  }
}

void saveData(int x, int y){
  locations[index] = x;
  index++;
  locations[index] = y;
  index++;
}

bool determineFuture(){
  int xDirection = 0;
  int yDirection = 0;
  
  /*
    Collect each x and y value. If 0 is out, we're back to where we started.
  */
  for(int x = 0; x <= index; x = x+2){
    xDirection = xDirection + locations[x];
  }
  
  for(int y = 1; y <= index; y = y+2){
    xDirection = xDirection + locations[y];
  }

  if(xDirection == 0 && yDirection == 0) {
    // We're back to the starting point.
    return true;
  }
  return false;
}
