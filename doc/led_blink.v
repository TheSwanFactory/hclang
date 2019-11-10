module led_simple(
    input clock,
    input reset,
    output led, led2, led3, led4, led5
    );

reg [26:0] count; //A sizable 27 bit register so that the blink can be seen and is visible, too small a register will make the
      //register stay on as it will blink extremely fast.

always@ (posedge clock or posedge reset)
 begin
  if (reset)
   count <= 0;  //if reset button is pressed, initialize or reset the register
  else
   count <= count + 1;  //otherwise increment the register
  end

assign led = count[26];   //MSB connected to output led. and the other outputs connected as below
assign led2 = count[25];
assign led3 = count[24];
assign led4 = count[23];
assign led5 = count[22];
endmodule
