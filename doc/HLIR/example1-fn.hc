; func.func @basic_ops(%arg0: i32, %arg1: f32) -> i32

.f (.arg0 <i32>, .arg1 <f32>) -> <i32> ^{
    ; %0 = arith.constant 42 : i32
    .const0 <i32> 42;
    
    ; %1 = arith.addi %arg0, %0 : i32
    .result1 arg0 + const0;
    
    ; %2 = arith.muli %1, %1 : i32
    .result2 result1 * result1;
    
    ; %3 = arith.constant 3.14 : f32
    .const1 <f32> 3.14;
    
    ; %4 = arith.addf %arg1, %3 : f32
    .result3 arg1 + const1;
    
    ; %5 = arith.fptosi %4 : f32 to i32
    .result4 <i32> result3;
    
    ; %6 = arith.addi %2, %5 : i32
    .result5 result2 + result4;
    
    ; return %6 : i32
    result5
}

; Same computation but using expression grouping to reduce variables
.g (.arg0 <i32>, .arg1 <f32>) ^{
    ; Constants
    .c0 <i32> 42;
    .c1 <f32> 3.14;
    
    ; Grouping the entire computation into a single expression
    ; Equivalent to all operations above
    .converted <i32> (arg1 + c1);
    arg0 + c0 * arg0 + c0 + converted 
}
