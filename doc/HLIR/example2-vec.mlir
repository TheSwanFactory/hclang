// Define a function that computes matrix multiplication
func.func @matrix_multiply(%A: tensor<2x3xf32>, %B: tensor<3x2xf32>) -> tensor<2x2xf32> {
  // Initialize the result tensor with zeros
  %init = arith.constant dense<0.0> : tensor<2x2xf32>

  // Use linalg operation for matrix multiplication
  %result = linalg.matmul ins(%A, %B: tensor<2x3xf32>, tensor<3x2xf32>)
                          outs(%init: tensor<2x2xf32>) -> tensor<2x2xf32>

  // Example of a custom operation with a region
  "example.reduce"(%result) ({
    ^bb0(%arg0: f32, %arg1: f32):
      %sum = arith.addf %arg0, %arg1 : f32
      "example.yield"(%sum) : (f32) -> ()
  }) : (tensor<2x2xf32>) -> tensor<2x2xf32>

  // Control flow example using scf dialect
  scf.for %i = %c0 to %c2 step %c1 {
    %slice = tensor.extract_slice %result[%i, 0] [1, 2] [1, 1] :
      tensor<2x2xf32> to tensor<1x2xf32>
  }

  // Return the result
  return %result : tensor<2x2xf32>
}

// Example of a custom dialect operation
#map = affine_map<(d0, d1) -> (d0 + d1)>

"custom.operation"() ({
  // Affine loop example
  affine.for %i = 0 to 10 {
    affine.for %j = 0 to 10 {
      %idx = affine.apply #map(%i, %j)
    }
  }
}) : () -> ()
