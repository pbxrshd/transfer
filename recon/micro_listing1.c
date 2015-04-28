#define A_PIN 6
#define B_PIN 7
#define PWM_PIN 3

/*
   Arduino    VNH5019
      6         INA
      7         INB
      3         PWM
     +5v        VDD
     GND        GND

Program listens to commands coming over serial. Commands are single characters, sent with no line ending.
f : turn forward at curent pwm value
r : reverse at current pwm value
+ : increment current pwm value by 10
- : decrement current pwm value by 10
anything else puts the motor to coast.

*/

byte pwm_value = 0;

void setup() {
  pinMode(A_PIN, OUTPUT);
  pinMode(B_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char incomingChar = Serial.read();
    switch (incomingChar) {
      case 'f':
        //digitalWrite(A_PIN, HIGH);
        //digitalWrite(B_PIN, LOW);    
        Serial.print(pwm_value); Serial.println(" forward");        
        break;
      case 'r':
        //digitalWrite(A_PIN, LOW);
        //digitalWrite(B_PIN, HIGH); 
        Serial.print(pwm_value); Serial.println(" reverse");
        break;      
      case '+':
        pwm_value = pwm_value + 10;
        //analogWrite(PWM_PIN, pwm_value);
        Serial.print(pwm_value); Serial.println(" pwm_value");
        break;
      case '-':
        pwm_value = pwm_value - 10;
        //analogWrite(PWM_PIN, pwm_value);
        Serial.print(pwm_value); Serial.println(" pwm_value");
        break;                
      default:
        //digitalWrite(A_PIN, LOW);
        //digitalWrite(B_PIN, LOW);
        Serial.print(pwm_value); Serial.println("stopped");
        break;
    }
  }
}
