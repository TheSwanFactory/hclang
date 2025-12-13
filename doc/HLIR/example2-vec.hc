; Import required dialects
. <- "func"
. <- "linalg"
. <- "arith"
. <- "scf"
. <- "affine"
. <- "memref"

; Matrix multiplication function
.f (.A <tensor<2x3xf32>>, .B <tensor<3x2xf32>>) -> <tensor<2x2xf32>> ^{
    ; Initialize result tensor
    .init <tensor<2x2xf32>> [0.0];

    ; Matrix multiplication using linalg
    .init linalg.matmul (A, B);

    ; Custom reduction operation with a block
    .reduced example.reduce init ^{
        (.x <f32>, .y <f32>) ^{
            x + y
        }
    };

    ; Control flow using scf
    .c0 <index> 0;
    .c1 <index> 1;
    .c2 <index> 2;

    ; For loop using scf
    c0 -> c2 & { (.i <index>) ^{
        .slice tensor.extract_slice (
            init,
            [i, c0],
            [c1, c2],
            [c1, c1]
        ) -> <tensor<1x2xf32>>;
    }};

    ; Return result
    init
}

; Custom operation with affine maps
.map affine (d0, d1) -> d0 + d1;

; Custom dialect operation block
.custom ^{
    ; Nested affine loops
    0 -> 10 & { (.i <index>) ^{
        0 -> 10 & { (.j <index>) ^{
            .idx map(i, j);
        }}
    }}
}
